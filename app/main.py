from datetime import date, timedelta
from pathlib import Path

from dateutil.relativedelta import relativedelta
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

app = FastAPI()
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
app.mount(
    path="/static",
    app=StaticFiles(directory=str(Path(__file__).parent / "static")),
    name="static",
)

TAX_RATES = {
    "andalucia": 0.06,
    "aragon": 0.08,
    "asturias": 0.08,
    "baleares": 0.04,
    "canarias": 0.05,
    "cantabria": 0.08,
    "castilla_y_leon": 0.08,
    "castilla_la_mancha": 0.06,
    "cataluna": 0.10,
    "valencia": 0.10,
    "extremadura": 0.07,
    "galicia": 0.07,
    "madrid": 0.06,
    "murcia": 0.08,
    "navarra": 0.05,
    "pais_vasco": 0.04,
    "rioja": 0.07,
}
NEW_BUILDING_TAX_RATE = 0.10


class MortgageRequest(BaseModel):
    price: float
    savings: float
    annual_rate_percent: float
    timeframe_years: int
    location: str
    is_second_hand: bool = False


class AmortizationResponse(BaseModel):
    all_months: list[date]
    all_years: list[int]
    total_paid: list[float]
    total_left: list[float]
    principal_paid_total: list[float]
    interest_paid_total: list[float]
    principal_left: list[float]
    interests_left: list[float]
    monthly_interest_paid: list[float]
    monthly_principal_paid: list[float]
    yearly_interest_paid: list[float]
    yearly_principal_paid: list[float]
    yearly_interest_paid_total: list[float]
    yearly_principal_paid_total: list[float]


class MortgageResponse(BaseModel):
    inputs: MortgageRequest
    monthly_payment: float
    mortgage_amount: float
    mortgage_interest: float
    financing_percent: float
    interest_percent: float
    tax_expenses: float
    notary_expenses: float
    registry_expenses: float
    administrative_expenses: float
    appraisal_expenses: float
    total_expenses: float
    total_cost: float
    amortization: AmortizationResponse


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/amortization", response_model=AmortizationResponse)
async def calculate_amortization(
    mortgage_amount: float,
    monthly_payment: float,
    annual_rate_percent: float,
    timeframe_years: int,
    initial_month: date | None = None,
) -> AmortizationResponse:
    initial_month = initial_month or (
        date.today().replace(day=1) + timedelta(days=32)
    ).replace(day=1)
    monthly_rate = (annual_rate_percent / 100) / 12
    num_payments = timeframe_years * 12

    # Calculate total interest over the lifetime of the loan
    total_interest = (monthly_payment * num_payments) - mortgage_amount

    remaining_balance = mortgage_amount
    remaining_interest = total_interest
    total_interest_paid = 0
    total_principal_paid = 0

    total_paid = []
    total_left = []
    principal_paid_total = []
    interest_paid_total = []
    principal_left = []
    interests_left = []
    monthly_interest_paid = []
    monthly_principal_paid = []

    for _ in range(num_payments):
        interest_payment = remaining_balance * monthly_rate
        principal_payment = monthly_payment - interest_payment

        total_interest_paid += interest_payment
        total_principal_paid += principal_payment
        remaining_balance -= principal_payment
        remaining_interest -= interest_payment

        total_paid.append(total_principal_paid + total_interest_paid)
        principal_paid_total.append(total_principal_paid)
        interest_paid_total.append(total_interest_paid)
        principal_left.append(remaining_balance)
        interests_left.append(remaining_interest)
        total_left.append(remaining_balance + remaining_interest)
        monthly_interest_paid.append(interest_payment)
        monthly_principal_paid.append(principal_payment)

    all_months = [initial_month + relativedelta(months=i) for i in range(num_payments)]
    all_years = [month.year for month in all_months]
    all_years = list(dict.fromkeys(all_years))

    yearly_interest_paid = []
    yearly_principal_paid = []
    yearly_interest_paid_total = []
    yearly_principal_paid_total = []
    total_interest_paid_year = 0
    total_principal_paid_year = 0
    current_year = initial_month.year

    for i, month in enumerate(all_months):
        if month.year != current_year:
            yearly_interest_paid.append(total_interest_paid_year)
            yearly_principal_paid.append(total_principal_paid_year)
            yearly_interest_paid_total.append(sum(yearly_interest_paid))
            yearly_principal_paid_total.append(sum(yearly_principal_paid))
            total_interest_paid_year = 0
            total_principal_paid_year = 0
            current_year = month.year

        total_interest_paid_year += monthly_interest_paid[i]
        total_principal_paid_year += monthly_principal_paid[i]

    # Add the last year's data
    yearly_interest_paid.append(total_interest_paid_year)
    yearly_principal_paid.append(total_principal_paid_year)
    yearly_interest_paid_total.append(sum(yearly_interest_paid))
    yearly_principal_paid_total.append(sum(yearly_principal_paid))

    return AmortizationResponse(
        all_months=all_months,
        all_years=all_years,
        total_paid=total_paid,
        total_left=total_left,
        principal_paid_total=principal_paid_total,
        interest_paid_total=interest_paid_total,
        principal_left=principal_left,
        interests_left=interests_left,
        monthly_interest_paid=monthly_interest_paid,
        monthly_principal_paid=monthly_principal_paid,
        yearly_interest_paid=yearly_interest_paid,
        yearly_principal_paid=yearly_principal_paid,
        yearly_interest_paid_total=yearly_interest_paid_total,
        yearly_principal_paid_total=yearly_principal_paid_total,
    )


@app.post("/calculate", response_model=MortgageResponse)
async def calculate_mortgage(request: MortgageRequest) -> MortgageResponse:
    try:
        savings_amount = request.savings
        price = request.price

        # Calculate tax rate
        tax_rate = (
            TAX_RATES.get(request.location, 0.06)
            if request.is_second_hand
            else NEW_BUILDING_TAX_RATE
        )

        # Calculate tax expenses
        tax_expenses = price * tax_rate

        # Calculate total expenses
        notary_expenses = 1105
        registry_expenses = 588
        administrative_expenses = 300
        appraisal_expenses = price / 1000

        total_expenses = (
            tax_expenses
            + notary_expenses
            + registry_expenses
            + administrative_expenses
            + appraisal_expenses
        )

        # Calculate mortgage amount
        mortgage_amount = price + total_expenses - savings_amount

        # Calculate monthly payment
        monthly_rate = (request.annual_rate_percent / 100) / 12
        num_payments = request.timeframe_years * 12
        monthly_payment = (
            mortgage_amount * monthly_rate * (1 + monthly_rate) ** num_payments
        ) / ((1 + monthly_rate) ** num_payments - 1)

        # Calculate total interest
        total_payments = monthly_payment * num_payments
        mortgage_interest = total_payments - mortgage_amount

        total_cost = price + mortgage_interest + total_expenses

        # Calculate financing percent
        financing_percent = (mortgage_amount / price) * 100

        # Calculate interest percent
        interest_percent = (mortgage_interest / mortgage_amount) * 100

        amortization_results = await calculate_amortization(
            mortgage_amount,
            monthly_payment,
            request.annual_rate_percent,
            request.timeframe_years,
        )

        return MortgageResponse(
            inputs=MortgageRequest(
                price=price,
                savings=savings_amount,
                annual_rate_percent=request.annual_rate_percent,
                timeframe_years=request.timeframe_years,
                location=request.location,
                is_second_hand=request.is_second_hand,
            ),
            monthly_payment=monthly_payment,
            mortgage_amount=mortgage_amount,
            mortgage_interest=mortgage_interest,
            financing_percent=financing_percent,
            interest_percent=interest_percent,
            tax_expenses=tax_expenses,
            notary_expenses=notary_expenses,
            registry_expenses=registry_expenses,
            administrative_expenses=administrative_expenses,
            appraisal_expenses=appraisal_expenses,
            total_expenses=total_expenses,
            total_cost=total_cost,
            amortization=amortization_results,
        )
    except Exception as e:
        print(f"Error calculating mortgage: {e}")
        raise HTTPException(status_code=422, detail=f"Error calculating mortgage: {e}")
