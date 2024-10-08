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
let amortizationChart;
let monthlyPaymentChart; // New variable for the monthly payment chart

function displayResults(data) {
    // Update the monthly payment amount in the UI
    const monthlyPaymentElement = document.getElementById('monthly-payment-amount');
    const monthlyPaymentDecimalsElement = document.getElementById('monthly-payment-decimals');
    if (monthlyPaymentElement) {
        let formattedPayment = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(data.monthly_payment);

        if (formattedPayment.length === 7) {
            formattedPayment = formattedPayment.slice(0, 1) + '.' + formattedPayment.slice(1);
        }

        const [wholePart, decimalsPart] = formattedPayment.split(',');
        monthlyPaymentElement.textContent = wholePart;
        monthlyPaymentDecimalsElement.textContent = ',' + decimalsPart;
    }

    const loanPercentElement = document.getElementById('loan-percent-amount');
    loanPercentElement.textContent = data.financing_percent.toFixed(2);

    const interestPercentElement = document.getElementById('interest-percent-amount');
    interestPercentElement.textContent = data.interest_percent.toFixed(2);

    // Update the comparison graph values
    const formatCurrency = (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    const formatCurrencyNoEur = (value) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    document.getElementById('interest-value').textContent = formatCurrency(data.mortgage_interest);
    document.getElementById('mortgage-value').textContent = formatCurrency(data.mortgage_amount);
    document.getElementById('savings-value').textContent = formatCurrency(data.inputs.savings);
    document.getElementById('left-total-value').textContent = formatCurrency(data.total_cost);
    document.getElementById('expenses-value').textContent = formatCurrency(data.total_expenses);
    document.getElementById('price-value').textContent = formatCurrency(data.inputs.price);
    document.getElementById('right-total-value').textContent = formatCurrency(data.inputs.price + data.total_expenses);


    // Helper function to set bar height with a minimum value
    const setBarHeight = (selector, value, total) => {
        const bar = document.querySelector(selector);
        const percentage = Math.max((value / total) * 100, 0.5); // Ensure a minimum height of 0.5%
        bar.style.height = `${percentage}%`;
    };

    // Update the graph bars
    const totalLeft = data.mortgage_interest + data.mortgage_amount + data.inputs.savings;
    setBarHeight('.left-graph .interest-bar', data.mortgage_interest, totalLeft);
    setBarHeight('.left-graph .mortgage-bar', data.mortgage_amount, totalLeft);
    setBarHeight('.left-graph .savings-bar', data.inputs.savings, totalLeft);
    setBarHeight('.right-graph .price-bar', data.inputs.price, totalLeft);
    setBarHeight('.right-graph .expenses-bar', data.total_expenses, totalLeft);
    document.body.offsetHeight;

    document.getElementById('loan-amount').textContent = formatCurrencyNoEur(data.mortgage_amount);
    document.getElementById('total-interest').textContent = formatCurrencyNoEur(data.mortgage_interest);
    document.getElementById('total-loan-cost').textContent = formatCurrencyNoEur(data.mortgage_amount + data.mortgage_interest);
    const finalDate = new Date(data.amortization.all_months[data.amortization.all_months.length - 1]);
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const formattedDate = `${monthNames[finalDate.getMonth()]} ${finalDate.getFullYear()}`;
    document.getElementById('final-payment-date').textContent = formattedDate;


    //Update the amortization chart
    updateAmortizationChart(data.amortization);

    // Update the monthly payment chart
    updateMonthlyPaymentChart(data.amortization);

    // Update the amortization tables
    updateAmortizationTables(data.amortization, data.mortgage_amount + data.mortgage_interest);
}

function updateAmortizationChart(amortizationData) {
    const ctx = document.getElementById('amortization-chart').getContext('2d');

    // Prepare the data for the chart
    const labels = Array.from({ length: amortizationData.principal_left.length }, (_, i) => i + 1);
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Capital pendiente',
                data: amortizationData.principal_left,
                borderColor: '#1028c4',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
            },
            {
                label: 'Intereses pendientes',
                data: amortizationData.interests_left,
                borderColor: '#1028c442',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 0,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 30,
                right: 10,
                top: 10,
                bottom: 20
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Años desde el comienzo'
                },
                grid: {
                    display: false
                },
                ticks: {
                    callback: function (value, index, values) {
                        if (value % 12 === 0) {
                            return Math.floor(value / 12);
                        }
                        return '';
                    },
                    autoSkip: false,
                    includeBounds: true,
                    minRotation: 0,
                    maxRotation: 0
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Cantidad (€)'
                },
                min: 0,
                ticks: {
                    callback: function (value) {
                        if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'M';
                        } else if (value >= 1000) {
                            return (value / 1000).toFixed(0) + 'k';
                        } else {
                            return value.toLocaleString('es-ES');
                        }
                    }
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    pointStyle: 'line'  // Change this to 'rect' for full squares
                }
            },
            title: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        }
    };

    if (amortizationChart) {
        // If the chart already exists, update its data
        amortizationChart.data = chartData;
        amortizationChart.options = chartOptions;
        amortizationChart.update();
    } else {
        // If the chart doesn't exist, create a new one
        amortizationChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
    }
}

function updateMonthlyPaymentChart(amortizationData) {
    const ctx = document.getElementById('monthly-payment-chart').getContext('2d');

    // Prepare the data for the chart
    const labels = Array.from({ length: amortizationData.monthly_principal_paid.length }, (_, i) => i + 1);
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Pago del préstamo',
                data: amortizationData.monthly_principal_paid,
                backgroundColor: '#1028c48d',
                borderColor: '#1028c48d',
                fill: true,
                pointRadius: 0,
                borderWidth: 0,
            },
            {
                label: 'Pago de los intereses',
                data: amortizationData.monthly_interest_paid,
                backgroundColor: '#1028c442',
                borderColor: '#1028c442',
                fill: true,
                pointRadius: 0,
                borderWidth: 0,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 15,
                right: 10,
                top: 10,
                bottom: 20
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Años desde el comienzo'
                },
                grid: {
                    display: false
                },
                ticks: {
                    callback: function (value, index, values) {
                        if (value % 12 === 0) {
                            return Math.floor(value / 12);
                        }
                        return '';
                    },
                    autoSkip: false,
                    includeBounds: true,
                    minRotation: 0,
                    maxRotation: 0
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Cantidad (€)'
                },
                stacked: true,
                min: 0,
                max: amortizationData.monthly_principal_paid[0] + amortizationData.monthly_interest_paid[0],
                ticks: {
                    callback: function (value) {
                        return value.toLocaleString('es-ES');
                    }
                }
            }
        },
        plugins: {
            title: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        }
    };

    if (monthlyPaymentChart) {
        // If the chart already exists, update its data
        monthlyPaymentChart.data = chartData;
        monthlyPaymentChart.options = chartOptions;
        monthlyPaymentChart.update();
    } else {
        // If the chart doesn't exist, create a new one
        monthlyPaymentChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
    }
}

function updateAmortizationTables(amortizationData, totalToPay) {
    const yearlyTableBody = document.getElementById('yearly-table-body');
    const monthlyTableBody = document.getElementById('monthly-table-body');

    // Clear existing table rows
    yearlyTableBody.innerHTML = '';
    monthlyTableBody.innerHTML = '';

    // Populate yearly table
    amortizationData.all_years.forEach((year, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${year}</td>
            <td>${formatTableCurrency(amortizationData.yearly_interest_paid_total[index])}</td>
            <td>${formatTableCurrency(amortizationData.yearly_principal_paid_total[index])}</td>
            <td>${formatTableCurrency(amortizationData.yearly_interest_paid_total[index] + amortizationData.yearly_principal_paid_total[index])}</td>
            <td>${formatTableCurrency(totalToPay - amortizationData.yearly_principal_paid_total[index] - amortizationData.yearly_interest_paid_total[index])}</td>
        `;
        yearlyTableBody.appendChild(row);
    });

    // Populate monthly table (initially for the first year)
    populateMonthlyTable(amortizationData.all_years[0], amortizationData, totalToPay);

    // Set up year selector for monthly table
    const prevYearBtn = document.getElementById('prev-year');
    const nextYearBtn = document.getElementById('next-year');
    const selectedYearSpan = document.getElementById('selected-year');

    selectedYearSpan.textContent = 'Año ' + amortizationData.all_years[0];
    let currentYearIndex = 0;

    prevYearBtn.addEventListener('click', () => {
        if (currentYearIndex > 0) {
            currentYearIndex--;
            selectedYearSpan.textContent = 'Año ' + amortizationData.all_years[currentYearIndex];
            populateMonthlyTable(amortizationData.all_years[currentYearIndex], amortizationData, totalToPay);
        }
    });

    nextYearBtn.addEventListener('click', () => {
        if (currentYearIndex < amortizationData.all_years.length - 1) {
            currentYearIndex++;
            selectedYearSpan.textContent = 'Año ' + amortizationData.all_years[currentYearIndex];
            populateMonthlyTable(amortizationData.all_years[currentYearIndex], amortizationData, totalToPay);
        }
    });
}

function populateMonthlyTable(year, amortizationData, totalToPay) {
    const monthlyTableBody = document.getElementById('monthly-table-body');
    monthlyTableBody.innerHTML = '';

    const startIndex = amortizationData.all_months.findIndex(month => month.slice(0, 4) === year.toString());
    const endIndex = amortizationData.all_months.findIndex(month => month.slice(0, 4) === (year + 1).toString());
    const finalEndIndex = endIndex === -1 ? amortizationData.all_months.length : endIndex;

    for (let i = startIndex; i < finalEndIndex; i++) {
        const row = document.createElement('tr');
        const date = new Date(amortizationData.all_months[i]);
        row.innerHTML = `
            <td>${date.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</td>
            <td>${formatTableCurrency(amortizationData.interest_paid_total[i])}</td>
            <td>${formatTableCurrency(amortizationData.principal_paid_total[i])}</td>
            <td>${formatTableCurrency(amortizationData.interest_paid_total[i] + amortizationData.principal_paid_total[i])}</td>
            <td>${formatTableCurrency(totalToPay - amortizationData.principal_paid_total[i] - amortizationData.interest_paid_total[i])}</td>
        `;
        monthlyTableBody.appendChild(row);
    }
}

function formatTableCurrency(value) {
    return new Intl.NumberFormat('es-ES', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
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
        const initialData = {};

        // Combine urlParams with placeholderData, prioritizing urlParams
        Object.keys(placeholderData).forEach(key => {
            initialData[key] = key in urlParams ? urlParams[key] : placeholderData[key];
        });

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

    const tableTabs = document.querySelectorAll('.table-tab');
    const tableContents = document.querySelectorAll('.table-tab-content');

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

    tableTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');

            tableTabs.forEach(t => t.classList.remove('active'));
            tableContents.forEach(c => c.classList.remove('active'));

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