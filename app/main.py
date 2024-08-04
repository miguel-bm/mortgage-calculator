from pathlib import Path

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
    "madrid": 0.06,
}
NEW_BUILDING_TAX_RATE = 0.10


class MortgageRequest(BaseModel):
    price: float
    savings: float
    annual_rate_percent: float
    timeframe_years: int
    location: str
    is_second_hand: bool = False


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


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


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
        )
    except Exception as e:
        print(f"Error calculating mortgage: {e}")
        raise HTTPException(status_code=422, detail=f"Error calculating mortgage: {e}")
