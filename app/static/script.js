const placeholderData = {
    price: 200000,
    savings: 40000,
    savings_percent: 20,
    annual_rate_percent: 3.7,
    timeframe_years: 30,
    location: "madrid",
    is_second_hand: true
};

const form = document.getElementById('mortgage-form');
const resultsContainer = document.getElementById('results');
let resultsChart;

function displayResults(data) {
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

form.addEventListener('submit', async (e) => {
    console.log('Form submitted');

    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.price = parseFloat(data.price);
    data.savings = parseFloat(data.savings);
    data.annual_rate_percent = parseFloat(data.annual_rate_percent);
    data.timeframe_years = parseInt(data.timeframe_years);
    data.location = data.location;
    data.is_second_hand = data.is_second_hand === 'true';

    try {
        const results = await calculateMortgage(data);
        displayResults(results);
        console.log('Results:', results);
    } catch (error) {
        console.error('Error displaying results:', error);
    }
});

// Display placeholder results on page load
window.addEventListener('load', async () => {
    try {
        const placeholderResults = await calculateMortgage(placeholderData);
        displayResults(placeholderResults);

        // Populate form with placeholder data
        Object.keys(placeholderData).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = placeholderData[key];
            }
        });

        const savingsPercentInput = document.getElementById('savings_percent')
        savingsPercentInput.value = (placeholderData.savings / placeholderData.price) * 100;

    } catch (error) {
        console.error('Error displaying placeholder results:', error);
    }
});

document.addEventListener('DOMContentLoaded', (event) => {
    const priceInput = document.getElementById('price');
    const savingsInput = document.getElementById('savings');
    const savingsPercentInput = document.getElementById('savings_percent');
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    function updateSavingsFromPercent() {
        const price = parseFloat(priceInput.value.replace(/\D/g, ''));
        const savingsPercent = parseFloat(savingsPercentInput.value);
        if (!isNaN(price) && !isNaN(savingsPercent)) {
            const savings = (savingsPercent / 100) * price;
            savingsInput.value = savings.toFixed(2);
        }
    }

    function updatePercentFromSavings() {
        const price = parseFloat(priceInput.value.replace(/\D/g, ''));
        const savings = parseFloat(savingsInput.value.replace(/\D/g, ''));
        if (!isNaN(price) && !isNaN(savings)) {
            const savingsPercent = (savings / price) * 100;
            savingsPercentInput.value = savingsPercent.toFixed(2);
        }
    }

    function updateSavingsPercentFromPrice() {
        const price = parseFloat(priceInput.value.replace(/\D/g, ''));
        const savings = parseFloat(savingsInput.value.replace(/\D/g, ''));
        if (!isNaN(price) && !isNaN(savings)) {
            const savingsPercent = (savings / price) * 100;
            savingsPercentInput.value = savingsPercent.toFixed(2);
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
        updateMoneyQuantityFormat(this);
    });
    savingsInput.addEventListener('input', function (e) {
        updateMoneyQuantityFormat(this);
    });
});

function updateMoneyQuantityFormat(inputElement) {
    const cursorPosition = inputElement.selectionStart;
    const oldLength = inputElement.value.length;
    let value = inputElement.value.replace(/\D/g, '');

    if (value) {
        value = parseInt(value, 10).toString();
        const formattedValue = new Intl.NumberFormat('es-ES').format(value);
        inputElement.value = formattedValue;

        // Calculate new cursor position
        const newLength = inputElement.value.length;
        const newPosition = cursorPosition - (oldLength - newLength);

        // Set the cursor back to the calculated position
        inputElement.setSelectionRange(newPosition, newPosition);
    }
}
