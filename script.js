// script.js (Frontend Logic with Google Maps, Chart.js, and API Communication)

// Global variables to hold the selected coordinates
let selectedLatitude = null;
let selectedLongitude = null;

// -----------------------------------------------------------------
// 1. GOOGLE MAPS INITIALIZATION
//    This function is called by the Google Maps API script tag in HTML.
// -----------------------------------------------------------------

function initMap() {
    // Set a default center (e.g., center of India)
    const initialCenter = { lat: 20.5937, lng: 78.9629 };
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: initialCenter,
        mapTypeControl: false,
    });

    // Add a draggable marker for the selected location
    let marker = new google.maps.Marker({
        position: initialCenter,
        map: map,
        draggable: true, 
        title: 'Selected Location'
    });

    // Set initial coordinates for global state and hidden inputs
    document.getElementById('latitude').value = initialCenter.lat;
    document.getElementById('longitude').value = initialCenter.lng;
    selectedLatitude = initialCenter.lat;
    selectedLongitude = initialCenter.lng;

    // Function to update marker position and store coordinates
    function placeMarkerAndPanTo(latLng, map) {
        marker.setPosition(latLng);
        map.panTo(latLng);

        selectedLatitude = latLng.lat();
        selectedLongitude = latLng.lng();

        document.getElementById('latitude').value = selectedLatitude;
        document.getElementById('longitude').value = selectedLongitude;
    }

    // 1. Handle Click Events (User clicks directly on the map)
    map.addListener('click', (e) => {
        placeMarkerAndPanTo(e.latLng, map);
    });

    // 2. Handle Drag End Events (User moves the marker)
    marker.addListener('dragend', () => {
        placeMarkerAndPanTo(marker.getPosition(), map);
    });

    // 3. Handle Search Box (Places Autocomplete)
    const input = document.getElementById('pac-input');
    const searchBox = new google.maps.places.SearchBox(input);
    
    // Optionally push the search box onto the map controls (might need CSS adjustments)
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(input); 

    searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        // Use the location found by the search
        placeMarkerAndPanTo(place.geometry.location, map);
        map.setZoom(12);
    });
}


// -----------------------------------------------------------------
// 2. CHART DRAWING FUNCTIONS (Used to visualize backend data)
// -----------------------------------------------------------------

function drawEnergyMixChart(mixData) {
    const ctx = document.getElementById('energy-mix-chart').getContext('2d');
    
    if (window.energyMixChart) {
        window.energyMixChart.destroy();
    }

    const labels = mixData.map(item => item.type); 
    const values = mixData.map(item => item.value); 

    window.energyMixChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(255, 159, 64, 0.8)', 
                    'rgba(54, 162, 235, 0.8)' 
                ],
                borderColor: [ '#ffffff', '#ffffff' ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: false }
            },
        },
    });
}

function drawSeasonalChart(seasonalData) {
    const ctx = document.getElementById('seasonal-chart').getContext('2d');
    
    if (window.seasonalChart) {
        window.seasonalChart.destroy();
    }

    const labels = seasonalData.map(item => item.season);
    const output = seasonalData.map(item => parseFloat(item.output)); 

    window.seasonalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Projected Output (kWh/day)',
                data: output,
                backgroundColor: 'rgba(40, 167, 69, 0.7)', 
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Projected Output (kWh/day)'
                    }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}


// -----------------------------------------------------------------
// 3. MAIN EXECUTION LOGIC (DOM Content Loaded)
// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', (event) => {
    const recommendationForm = document.getElementById('recommendation-form');
    const resultsDashboard = document.getElementById('results-dashboard');
    
    // Slider Value Display (Budget)
    const budgetSlider = document.getElementById('budget');
    const budgetValueSpan = document.getElementById('budget-value'); 
    
    function updateBudgetValue(slider) {
        const value = parseInt(slider.value);
        budgetValueSpan.textContent = '₹ ' + new Intl.NumberFormat('en-IN').format(value);
    }
    
    if (budgetSlider) {
        updateBudgetValue(budgetSlider); 
    }

    budgetSlider.oninput = function() {
        updateBudgetValue(this);
    };


    // -----------------------------------------------------------------
    // 4. API COMMUNICATION (FORM SUBMISSION)
    // -----------------------------------------------------------------

    recommendationForm.onsubmit = async function(e) {
        e.preventDefault();
        
        // Gather new coordinate inputs from the hidden fields
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;
        const consumption = document.getElementById('consumption').value;
        const budget = document.getElementById('budget').value;
        const systemType = document.querySelector('input[name="system_type"]:checked').value; 
        
        // Basic validation for map selection
        if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
            alert("Please select a valid location on the map.");
            return;
        }

        console.log("Sending Inputs:", { latitude, longitude, consumption, budget, systemType });
        
        const submitButton = document.getElementById('get-recommendation');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = "Calculating...";
        submitButton.disabled = true;

        resultsDashboard.classList.add('hidden'); 
        
        try {
            const response = await fetch('http://localhost:3000/api/recommendation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Send coordinates instead of location string
                body: JSON.stringify({ latitude, longitude, consumption, budget, systemType })
            });

            if (!response.ok) {
                throw new Error('Backend response failed or server is offline.');
            }

            const data = await response.json();
            
            // FIX: Show the results dashboard BEFORE drawing the charts for Chart.js visibility.
            resultsDashboard.classList.remove('hidden');

            // Update the Dashboard Text and Figures
            document.getElementById('recommended-mix').textContent = data.recommendedMix;
            document.getElementById('system-size').textContent = `Required System Size: ${data.systemSize}`;
            
            // Format numbers 
            document.getElementById('annual-savings').textContent = `₹ ${new Intl.NumberFormat('en-IN').format(data.annualSavings)}`;
            document.getElementById('co2-reduction').textContent = `${new Intl.NumberFormat().format(data.co2Reduction)} kg/year`;
            document.getElementById('setup-cost').textContent = `₹ ${new Intl.NumberFormat('en-IN').format(data.setupCost)}`;
            
            // NEW LOGIC: Handle Budget Status Indicator
            const budgetStatus = document.getElementById('budget-status');
            
            if (data.isWithinBudget) {
                budgetStatus.textContent = "✅ Within Budget";
                budgetStatus.className = 'budget-status-indicator budget-status-within';
            } else {
                budgetStatus.textContent = "⚠️ OVER Budget Limit! Adjusting the mix is recommended.";
                budgetStatus.className = 'budget-status-indicator budget-status-over';
            }

            // CHART RENDERING LOGIC
            drawEnergyMixChart(data.energyMix);
            drawSeasonalChart(data.seasonalData);
            
            // Scroll to results
            resultsDashboard.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error("Error fetching recommendation:", error);
            alert(`Error: Could not connect to the backend server. Please ensure Node.js server is running on port 3000.`);
        } finally {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    };
});