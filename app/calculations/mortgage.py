from datetime import date

from pydantic import BaseModel

from .amortization import (
    AmortizationRequest,
    AmortizationResponse,
    Payment,
    calculate_amortization,
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
    loan_start_date: date | None = None
    extra_payments: list[Payment] | None = None


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


async def calculate_mortgage(request: MortgageRequest) -> MortgageResponse:
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
        AmortizationRequest(
            mortgage_amount=mortgage_amount,
            annual_rate_percent=request.annual_rate_percent,
            timeframe_years=request.timeframe_years,
            loan_start_date=request.loan_start_date,
            extra_payments=request.extra_payments,
        )
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
