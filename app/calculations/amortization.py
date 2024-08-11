from datetime import date, timedelta

from dateutil.relativedelta import relativedelta
from pydantic import BaseModel


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


class Payment(BaseModel):
    date: date
    amount: float


class AmortizationRequest(BaseModel):
    mortgage_amount: float
    annual_rate_percent: float
    timeframe_years: int
    loan_start_date: date | None = None
    extra_payments: list[Payment] | None = None


async def calculate_amortization(request: AmortizationRequest) -> AmortizationResponse:
    extra_payments_left = (request.extra_payments or []).copy()
    next_first_month = (date.today().replace(day=1) + timedelta(days=32)).replace(day=1)
    loan_start_date = request.loan_start_date or next_first_month
    num_payments = request.timeframe_years * 12
    all_months = [
        loan_start_date + relativedelta(months=i) for i in range(num_payments)
    ]

    monthly_rate = (request.annual_rate_percent / 100) / 12

    monthly_payment = (
        request.mortgage_amount * monthly_rate * (1 + monthly_rate) ** num_payments
    ) / ((1 + monthly_rate) ** num_payments - 1)

    remaining_balance = request.mortgage_amount
    total_interest_paid = 0
    total_principal_paid = 0

    total_paid_array = []
    total_principal_paid_array = []
    total_interest_paid_array = []
    principal_left_array = []
    monthly_interest_paid_array = []
    monthly_principal_paid_array = []

    for i, month in enumerate(all_months):
        monthly_interest_to_pay = remaining_balance * monthly_rate
        monthly_interest_payment_left = monthly_interest_to_pay

        interest_paid = 0
        principal_paid = 0
        new_extra_payments_left = []
        month_payment = Payment(date=month, amount=monthly_payment)
        for payment in extra_payments_left + [month_payment]:
            amount = payment.amount

            if payment.date <= month:
                interest_payment = min(monthly_interest_payment_left, amount)
                monthly_interest_payment_left -= interest_payment
                interest_paid += interest_payment

                amount -= interest_payment
                principal_paid += min(amount, remaining_balance)
                remaining_balance = max(0, remaining_balance - amount)

            else:
                new_extra_payments_left.append(payment)

        extra_payments_left = new_extra_payments_left

        total_interest_paid += interest_paid
        total_principal_paid += principal_paid
        total_paid = total_principal_paid + total_interest_paid

        total_paid_array.append(total_paid)
        total_principal_paid_array.append(total_principal_paid)
        total_interest_paid_array.append(total_interest_paid)
        principal_left_array.append(remaining_balance)
        monthly_interest_paid_array.append(interest_paid)
        monthly_principal_paid_array.append(principal_paid)

        if remaining_balance <= 0:
            break

    all_months = all_months[: len(total_paid_array)]
    all_years = [month.year for month in all_months]
    all_years = list(dict.fromkeys(all_years))

    yearly_interest_paid_array = []
    yearly_principal_paid_array = []
    yearly_interest_paid_total_array = []
    yearly_principal_paid_total_array = []
    total_interest_paid_year = 0
    total_principal_paid_year = 0
    current_year = loan_start_date.year

    for i, month in enumerate(all_months):
        if month.year != current_year:
            yearly_interest_paid_array.append(total_interest_paid_year)
            yearly_principal_paid_array.append(total_principal_paid_year)
            yearly_interest_paid_total_array.append(sum(yearly_interest_paid_array))
            yearly_principal_paid_total_array.append(sum(yearly_principal_paid_array))
            total_interest_paid_year = 0
            total_principal_paid_year = 0
            current_year = month.year

        total_interest_paid_year += monthly_interest_paid_array[i]
        total_principal_paid_year += monthly_principal_paid_array[i]

    # Add the last year's data
    yearly_interest_paid_array.append(total_interest_paid_year)
    yearly_principal_paid_array.append(total_principal_paid_year)
    yearly_interest_paid_total_array.append(sum(yearly_interest_paid_array))
    yearly_principal_paid_total_array.append(sum(yearly_principal_paid_array))

    return AmortizationResponse(
        all_months=all_months,
        all_years=all_years,
        total_paid=total_paid_array,
        total_left=total_paid_array,
        principal_paid_total=total_principal_paid_array,
        interest_paid_total=total_interest_paid_array,
        principal_left=principal_left_array,
        interests_left=total_interest_paid_array,
        monthly_interest_paid=monthly_interest_paid_array,
        monthly_principal_paid=monthly_principal_paid_array,
        yearly_interest_paid=yearly_interest_paid_array,
        yearly_principal_paid=yearly_principal_paid_array,
        yearly_interest_paid_total=yearly_interest_paid_total_array,
        yearly_principal_paid_total=yearly_principal_paid_total_array,
    )
