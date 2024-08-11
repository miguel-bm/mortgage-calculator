from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .calculations.amortization import (
    AmortizationRequest,
    AmortizationResponse,
    calculate_amortization,
)
from .calculations.mortgage import MortgageRequest, MortgageResponse, calculate_mortgage

app = FastAPI()
templates = Jinja2Templates(directory="static")
app.mount(path="/static", app=StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(
        "index.html", {"request": request}, media_type="text/html"
    )


@app.post("/amortization", response_model=AmortizationResponse)
async def amortization_endpoint(request: AmortizationRequest) -> AmortizationResponse:
    try:
        return await calculate_amortization(request)
    except Exception as e:
        print(f"Error calculating amortization: {e}")
        raise HTTPException(
            status_code=422, detail=f"Error calculating amortization: {e}"
        )


@app.post("/calculate", response_model=MortgageResponse)
async def calculate_endpoint(request: MortgageRequest) -> MortgageResponse:
    try:
        return await calculate_mortgage(request)
    except Exception as e:
        print(f"Error calculating mortgage: {e}")
        raise HTTPException(status_code=422, detail=f"Error calculating mortgage: {e}")
