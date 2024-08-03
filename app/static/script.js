const placeholderData = {
    price: 300000,
    savings: 75000,
    savings_percent: 25,
    annual_rate_percent: 2.70,
    timeframe_years: 25,
    location: "madrid",
    is_second_hand: true
};

const form = document.getElementById('mortgage-form');
const resultsContainer = document.getElementById('results');
let resultsChart;

function displayResults(data) {

    // Update the monthly payment amount in the UI
    const monthlyPaymentElement = document.getElementById('monthly-payment-amount');
    const monthlyPaymentDecimalsElement = document.getElementById('monthly-payment-decimals');
    if (monthlyPaymentElement) {
        // Format the monthly payment as a currency string
        let formattedPayment = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(data.monthly_payment);

        // if len is 7, add an extra dot (1234,56 -> 1.234,56)
        if (formattedPayment.length === 7) {
            formattedPayment = formattedPayment.slice(0, 1) + '.' + formattedPayment.slice(1);
        }

        // get the whole part
        const wholePart = formattedPayment.split(',')[0];
        const decimalsPart = ',' + formattedPayment.split(',')[1];

        // Update the content of the element
        monthlyPaymentElement.textContent = wholePart;
        monthlyPaymentDecimalsElement.textContent = decimalsPart;

    }

    resultsContainer.innerHTML = `
        <div class="result-item"><span class="result-label">Cuota mensual:</span> ${data.monthly_payment.toFixed(2)}€</div>
        <div class="result-item"><span class="result-label">Importe de la hipoteca:</span> ${data.mortgage_amount.toFixed(2)}€</div>
        <div class="result-item"><span class="result-label">Intereses totales:</span> ${data.mortgage_interest.toFixed(2)}€</div>
        <div class="result-item"><span class="result-label">Porcentaje de financiación:</span> ${data.financing_percent.toFixed(2)}%</div>
        <div class="result-item"><span class="result-label">Gastos de impuestos:</span> ${data.tax_expenses.toFixed(2)}€</div>
        <div class="result-item"><span class="result-label">Gastos de notaría:</span> ${data.notary_expenses.toFixed(2)}€</div>
        <div class="result-item"><span class="result-label">Gastos de registro:</span> ${data.registry_expenses.toFixed(2)}€</div>
        <div class="result-item"><span class="result-label">Gastos administrativos:</span> ${data.administrative_expenses.toFixed(2)}€</div>
        <div class="result-item"><span class="result-label">Gastos de tasación:</span> ${data.appraisal_expenses.toFixed(2)}€</div>
        <div class="result-item"><span class="result-label">Total de gastos:</span> ${data.total_expenses.toFixed(2)}€</div>
        <div class="result-item"><span class="result-label">Coste total:</span> ${data.total_cost.toFixed(2)}€</div>
    `;

    updateChart(data);
}

function updateChart(data) {
    const ctx = document.getElementById('results-chart').getContext('2d');

    if (resultsChart) {
        resultsChart.destroy();
    }

    resultsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Importe hipoteca', 'Intereses', 'Gastos totales'],
            datasets: [{
                label: 'Desglose de costes',
                data: [data.mortgage_amount, data.mortgage_interest, data.total_expenses],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function calculateMortgage(input_data) {
    console.log('Sending input_data to server:', input_data);
    const response = await fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            price: input_data.price,
            savings: input_data.savings,
            annual_rate_percent: input_data.annual_rate_percent,
            timeframe_years: input_data.timeframe_years,
            location: input_data.location,
            is_second_hand: input_data.is_second_hand
        })
    });

    if (response.ok) {
        const result = await response.json();
        console.log('Received response from server:', result);
        return result;
    } else {
        const errorText = await response.text();
        console.error('Error calculating mortgage:', errorText);
        throw new Error(errorText);
    }
}

// Add these helper functions
function formatToRaw(value, type) {
    if (type === 'money') {
        return value.replace(/\./g, '');
    } else if (type === 'percent') {
        return value.replace(',', '.');
    }
    return value;
}

function rawToFormatted(value, type) {
    if (type === 'money') {
        return new Intl.NumberFormat('es-ES').format(parseFloat(value));
    } else if (type === 'percent') {
        return parseFloat(value).toFixed(2).replace('.', ',');
    }
    return value;
}

// Modify the getUrlParams function
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        if (key === 'price' || key === 'savings') {
            result[key] = parseFloat(value);
        } else if (key === 'annual_rate_percent' || key === 'savings_percent') {
            result[key] = parseFloat(value.replace(',', '.'));
        } else if (key === 'is_second_hand') {
            result[key] = value === 'true';
        } else {
            result[key] = value;
        }
    }
    return result;
}

// Modify the window load event listener
window.addEventListener('load', async () => {
    try {
        const urlParams = getUrlParams();
        const initialData = Object.keys(urlParams).length > 0 ? urlParams : placeholderData;

        // Update form with URL parameters or placeholder data
        Object.keys(initialData).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                if (key === 'price' || key === 'savings') {
                    input.value = rawToFormatted(initialData[key], 'money');
                } else if (key === 'annual_rate_percent' || key === 'savings_percent') {
                    input.value = rawToFormatted(initialData[key], 'percent');
                } else if (key === 'is_second_hand') {
                    input.value = initialData[key];
                } else {
                    input.value = initialData[key];
                }
            }
        });

        // Calculate and display results
        const results = await calculateMortgage(initialData);
        displayResults(results);

        // Apply formatting to inputs
        updateMoneyQuantityFormat(document.getElementById('price'));
        updateMoneyQuantityFormat(document.getElementById('savings'));
        updatePercentQuantityFormat(document.getElementById('savings_percent'));
        updatePercentQuantityFormat(document.getElementById('annual_rate_percent'));
        updateYearsQuantityFormat(document.getElementById('timeframe_years'));

        // Update URL with current parameters
        updateUrlWithFormData();

    } catch (error) {
        console.error('Error displaying initial results:', error);
    }
});

// Modify the updateUrlWithFormData function
function updateUrlWithFormData() {
    const formData = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        if (key === 'price' || key === 'savings') {
            params.append(key, formatToRaw(value, 'money'));
        } else if (key === 'annual_rate_percent' || key === 'savings_percent') {
            params.append(key, formatToRaw(value, 'percent'));
        } else {
            params.append(key, value);
        }
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.pushState(null, '', newUrl);
}

// Modify the form submit event listener
form.addEventListener('submit', async (e) => {
    console.log('Form submitted');

    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.price = parseFloat(data.price.replace('.', '').replace(',', '.'));
    data.savings = parseFloat(data.savings.replace('.', '').replace(',', '.'));
    data.annual_rate_percent = parseFloat(data.annual_rate_percent.replace('.', '').replace(',', '.'));
    data.timeframe_years = parseInt(data.timeframe_years);
    data.location = data.location;
    data.is_second_hand = data.is_second_hand === 'true';

    try {
        const results = await calculateMortgage(data);
        displayResults(results);
        console.log('Results:', results);
        updateUrlWithFormData(); // Update URL after form submission
    } catch (error) {
        console.error('Error displaying results:', error);
    }
});

document.addEventListener('DOMContentLoaded', (event) => {
    const priceInput = document.getElementById('price');
    const savingsInput = document.getElementById('savings');
    const savingsPercentInput = document.getElementById('savings_percent');
    const annualRatePercentInput = document.getElementById('annual_rate_percent');
    const timeframeYearsInput = document.getElementById('timeframe_years');

    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    function updateSavingsFromPercent() {
        const price = parseFloat(priceInput.value.replace(/\D/g, ''));
        const savingsPercent = parseFloat(savingsPercentInput.value.replace(',', '.'));
        if (!isNaN(price) && !isNaN(savingsPercent)) {
            const savings = (savingsPercent / 100) * price;
            const savingsStr = savings.toFixed(0);
            savingsInput.value = savingsStr;
            updateMoneyQuantityFormat(savingsInput, null);
        }
    }

    function updatePercentFromSavings() {
        const price = parseFloat(priceInput.value.replace(/\D/g, ''));
        const savings = parseFloat(savingsInput.value.replace(/\D/g, ''));
        if (!isNaN(price) && !isNaN(savings)) {
            const savingsPercent = (savings / price) * 100;
            const savingsPercentStr = savingsPercent.toFixed(2).replace('.', ',');
            savingsPercentInput.value = savingsPercentStr;
            updatePercentQuantityFormat(savingsPercentInput, null);
        }
    }

    function updateSavingsPercentFromPrice() {
        const price = parseFloat(priceInput.value.replace(/\D/g, ''));
        const savings = parseFloat(savingsInput.value.replace(/\D/g, ''));
        if (!isNaN(price) && !isNaN(savings)) {
            const savingsPercent = (savings / price) * 100;
            const savingsPercentStr = savingsPercent.toFixed(2).replace('.', ',');
            savingsPercentInput.value = savingsPercentStr;
            updatePercentQuantityFormat(savingsPercentInput, null);
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    savingsPercentInput.addEventListener('input', updateSavingsFromPercent);
    savingsInput.addEventListener('input', updatePercentFromSavings);
    priceInput.addEventListener('input', updateSavingsPercentFromPrice);

    // Add event listener for formatting
    priceInput.addEventListener('input', function (e) {
        updateMoneyQuantityFormat(this, e);
    });
    savingsInput.addEventListener('input', function (e) {
        updateMoneyQuantityFormat(this, e);
    });
    savingsPercentInput.addEventListener('input', function (e) {
        updatePercentQuantityFormat(this, e);
    });
    annualRatePercentInput.addEventListener('input', function (e) {
        updatePercentQuantityFormat(this, e);
    });
    timeframeYearsInput.addEventListener('input', function (e) {
        updateYearsQuantityFormat(this, e);
    });
    timeframeYearsInput.addEventListener('blur', function (e) {
        onBlurYearsQuantityFormat(this, e);
    });
});

function updateMoneyQuantityFormat(inputElement, event) {
    // We want no decimals, and a dot as thousands separator

    // Store the current cursor position
    const cursorPosition = inputElement.selectionStart;

    // Remove any non-digit characters from the input
    let value = inputElement.value.replace(/\D/g, '');

    // Convert to a number and format with thousands separator
    if (value !== '') {
        const number = parseInt(value, 10);
        value = number.toLocaleString('es-ES');
    }

    // If len is 4, add dot in the second position
    if (value.length === 4) {
        value = value.slice(0, 1) + '.' + value.slice(1);
    }

    // Calculate the difference in length after formatting
    const lengthDifference = value.length - inputElement.value.length;

    // Update the input value
    inputElement.value = value;

    // Adjust the cursor position
    const newPosition = cursorPosition + lengthDifference;
    inputElement.setSelectionRange(newPosition, newPosition);

    // If event was backspace and newPosition is just after one of the ".", move cursor one further to the left
    if (event && event.inputType === 'deleteContentBackward' && newPosition > 0 && inputElement.value[newPosition - 1] === '.') {
        inputElement.setSelectionRange(newPosition - 1, newPosition - 1);
    }
}


function updatePercentQuantityFormat(inputElement, event) {
    // Store the current cursor position
    const cursorPosition = inputElement.selectionStart;

    // Remove any non-digit characters except for the first comma
    let value = inputElement.value.replace(/[^\d,]/g, '');
    const commaIndex = value.indexOf(',');
    if (commaIndex !== -1) {
        value = value.slice(0, commaIndex + 1) + value.slice(commaIndex + 1).replace(/,/g, '');
    }

    // Ensure the value doesn't exceed 999,99
    let [integerPart, decimalPart] = value.split(',');
    integerPart = integerPart.slice(0, 3);
    if (parseInt(integerPart) > 999) {
        integerPart = '999';
    }
    if (decimalPart) {
        decimalPart = decimalPart.slice(0, 2);
    }

    // Reconstruct the value, allowing a trailing comma
    value = integerPart + (value.endsWith(',') || decimalPart ? ',' + (decimalPart || '') : '');

    // Update the input value
    inputElement.value = value;

    // Adjust the cursor position
    const newPosition = Math.min(cursorPosition, value.length);
    inputElement.setSelectionRange(newPosition, newPosition);
}


function updateYearsQuantityFormat(inputElement, event) {
    // We want no decimals, no thousands separator, and 99 years max
    let value = inputElement.value.replace(/\D/g, '');
    inputElement.value = value;
    const newPosition = Math.min(cursorPosition, value.length);
    inputElement.setSelectionRange(newPosition, newPosition);
}


function onBlurYearsQuantityFormat(inputElement) {
    // Min 1 year, max 40 years
    let value = inputElement.value.replace(/\D/g, '');
    value = Math.min(value, 40);
    value = Math.max(value, 1);
    inputElement.value = value;
}

function onBlurPriceQuantityFormat(inputElement) {
    // Min 1000€, max 100.000€
    let value = inputElement.value.replace(/\D/g, '');
    value = Math.min(value, 100000);
    value = Math.max(value, 1000);
    inputElement.value = value;
}