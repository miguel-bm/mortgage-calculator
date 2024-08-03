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
        # Calculate savings amount
        savings_amount = request.savings

        # Calculate mortgage amount
        mortgage_amount = request.price - savings_amount

        # Calculate financing percent
        financing_percent = (mortgage_amount / request.price) * 100

        # Calculate monthly payment
        monthly_rate = (request.annual_rate_percent / 100) / 12
        num_payments = request.timeframe_years * 12
        monthly_payment = (
            mortgage_amount * monthly_rate * (1 + monthly_rate) ** num_payments
        ) / ((1 + monthly_rate) ** num_payments - 1)

        # Calculate total interest
        total_payments = monthly_payment * num_payments
        mortgage_interest = total_payments - mortgage_amount

        tax_rate = (
            TAX_RATES.get(request.location, 0.06)
            if request.is_second_hand
            else NEW_BUILDING_TAX_RATE
        )

        # Calculate tax expenses
        tax_expenses = request.price * tax_rate

        # Expenses
        notary_expenses = 0.01 * request.price  # 1% of property price
        registry_expenses = 0.005 * request.price  # 0.5% of property price
        administrative_expenses = 500  # Fixed amount
        appraisal_expenses = 300  # Fixed amount

        # Calculate total expenses and total cost
        total_expenses = (
            tax_expenses
            + notary_expenses
            + registry_expenses
            + administrative_expenses
            + appraisal_expenses
        )
        total_cost = request.price + mortgage_interest + total_expenses

        return MortgageResponse(
            inputs=MortgageRequest(
                price=request.price,
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
