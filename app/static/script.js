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

    function updateSavingsFromPercent() {
        const price = parseFloat(priceInput.value);
        const savingsPercent = parseFloat(savingsPercentInput.value);
        if (!isNaN(price) && !isNaN(savingsPercent)) {
            const savings = (savingsPercent / 100) * price;
            savingsInput.value = savings.toFixed(2);
        }
    }

    function updatePercentFromSavings() {
        const price = parseFloat(priceInput.value);
        const savings = parseFloat(savingsInput.value);
        if (!isNaN(price) && !isNaN(savings)) {
            const savingsPercent = (savings / price) * 100;
            savingsPercentInput.value = savingsPercent.toFixed(2);
        }
    }

    function updateSavingsPercentFromPrice() {
        const price = parseFloat(priceInput.value);
        const savings = parseFloat(savingsInput.value);
        if (!isNaN(price) && !isNaN(savings)) {
            const savingsPercent = (savings / price) * 100;
            savingsPercentInput.value = savingsPercent.toFixed(2);
        }
    }

    savingsPercentInput.addEventListener('input', updateSavingsFromPercent);
    savingsInput.addEventListener('input', updatePercentFromSavings);
    priceInput.addEventListener('input', updateSavingsPercentFromPrice);
});

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Hide all elements with class="tab-content" by default
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove the class "active" from all tablinks
    tablinks = document.getElementsByClassName("tab-button");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Get the element with id="defaultOpen" and click on it to open the default tab
document.getElementById("defaultOpen").click();