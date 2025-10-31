// Page Navigation Functions
function showMainPage() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
    document.getElementById('resultsPage').style.display = 'none';
}

function showResultsPage() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('resultsPage').style.display = 'block';
}

// Form Submission Handler
function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        destination: document.getElementById('destination').value,
        duration: document.getElementById('duration').value,
        budget: document.getElementById('budget').value,
        travelers: document.getElementById('travelers').value,
        travelType: document.getElementById('travelType').value,
        accommodation: document.getElementById('accommodation').value,
        specificSpots: document.getElementById('specificSpots').value,
        preferences: document.getElementById('preferences').value
    };

    // Show results page immediately
    displaySummary(formData);
    showResultsPage();
    
    // Show loading state
    document.getElementById('itineraryContent').innerHTML = '<div class="loading">Processing your request with greedy algorithm...</div>';

    // TODO: Send formData to your backend greedy algorithm
    // Example:
    // fetch('/api/generate-itinerary', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(formData)
    // })
    // .then(response => response.json())
    // .then(data => displayItinerary(data))
    // .catch(error => console.error('Error:', error));

    // Simulating backend response for demo (remove this when connecting real backend)
    setTimeout(() => {
        displayItinerary();
    }, 1500);
}

// Display Trip Summary
function displaySummary(data) {
    const summaryHTML = `
        <div class="summary-item">
            <span class="summary-label">Destination:</span>
            <span class="summary-value">${data.destination}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Duration:</span>
            <span class="summary-value">${data.duration} days</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Budget:</span>
            <span class="summary-value">₹${data.budget}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Travelers:</span>
            <span class="summary-value">${data.travelers} person(s)</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Travel Type:</span>
            <span class="summary-value">${data.travelType}</span>
        </div>
    `;
    document.getElementById('summaryContent').innerHTML = summaryHTML;
}

// Display Itinerary Results
function displayItinerary() {
    // This function will display the results from your greedy algorithm
    // For demo purposes, I'm showing a sample itinerary structure
    
    // Sample data structure (replace with actual backend response)
    const sampleItinerary = {
        days: [
            {
                day: 1,
                date: "2025-11-01",
                activities: [
                    {
                        time: "09:00 AM",
                        name: "Arrival & Hotel Check-in",
                        description: "Check into budget-friendly hotel in city center",
                        cost: 1500
                    },
                    {
                        time: "11:00 AM",
                        name: "Local Market Visit",
                        description: "Explore local markets and street food",
                        cost: 300
                    },
                    {
                        time: "02:00 PM",
                        name: "City Museum Tour",
                        description: "Visit the famous city museum with guided tour",
                        cost: 200
                    },
                    {
                        time: "06:00 PM",
                        name: "Sunset Point",
                        description: "Enjoy scenic sunset views at popular viewpoint",
                        cost: 0
                    }
                ]
            },
            {
                day: 2,
                date: "2025-11-02",
                activities: [
                    {
                        time: "08:00 AM",
                        name: "Historical Fort Visit",
                        description: "Explore ancient fort with amazing architecture",
                        cost: 250
                    },
                    {
                        time: "12:00 PM",
                        name: "Local Cuisine Experience",
                        description: "Authentic local restaurant for lunch",
                        cost: 400
                    },
                    {
                        time: "03:00 PM",
                        name: "Beach/Park Relaxation",
                        description: "Leisure time at scenic beach or park",
                        cost: 100
                    },
                    {
                        time: "07:00 PM",
                        name: "Cultural Show",
                        description: "Traditional dance and music performance",
                        cost: 350
                    }
                ]
            },
            {
                day: 3,
                date: "2025-11-03",
                activities: [
                    {
                        time: "07:00 AM",
                        name: "Nature Trek",
                        description: "Morning trek to nearby hills or nature spot",
                        cost: 500
                    },
                    {
                        time: "01:00 PM",
                        name: "Shopping District",
                        description: "Local handicrafts and souvenir shopping",
                        cost: 800
                    },
                    {
                        time: "05:00 PM",
                        name: "Departure",
                        description: "Check-out and journey back home",
                        cost: 0
                    }
                ]
            }
        ],
        budgetBreakdown: {
            accommodation: 4500,
            food: 2500,
            activities: 1700,
            transportation: 2000,
            miscellaneous: 800
        }
    };

    // Build itinerary HTML
    let itineraryHTML = '';
    sampleItinerary.days.forEach(day => {
        itineraryHTML += `
            <div class="day-card">
                <div class="day-header">
                    <span>📅</span>
                    <span>Day ${day.day} - ${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="activity-list">
        `;
        
        day.activities.forEach(activity => {
            itineraryHTML += `
                <div class="activity-item">
                    <div class="activity-time">⏰ ${activity.time}</div>
                    <div class="activity-name">${activity.name}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-cost">💰 ₹${activity.cost}</div>
                </div>
            `;
        });
        
        itineraryHTML += `
                </div>
            </div>
        `;
    });

    // Add travel tips
    itineraryHTML += `
        <div class="tips-section">
            <h4>💡 Budget Travel Tips</h4>
            <ul>
                <li>Book accommodations in advance for better deals</li>
                <li>Use local transportation to save money</li>
                <li>Try street food and local eateries</li>
                <li>Look for free walking tours and attractions</li>
                <li>Travel during off-season for lower prices</li>
            </ul>
        </div>
    `;

    document.getElementById('itineraryContent').innerHTML = itineraryHTML;

    // Build budget breakdown HTML
    const breakdown = sampleItinerary.budgetBreakdown;
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    
    let budgetHTML = `
        <div class="budget-item">
            <span class="budget-category">🏨 Accommodation</span>
            <span class="budget-amount">₹${breakdown.accommodation}</span>
        </div>
        <div class="budget-item">
            <span class="budget-category">🍽️ Food & Dining</span>
            <span class="budget-amount">₹${breakdown.food}</span>
        </div>
        <div class="budget-item">
            <span class="budget-category">🎯 Activities & Attractions</span>
            <span class="budget-amount">₹${breakdown.activities}</span>
        </div>
        <div class="budget-item">
            <span class="budget-category">🚗 Transportation</span>
            <span class="budget-amount">₹${breakdown.transportation}</span>
        </div>
        <div class="budget-item">
            <span class="budget-category">🛍️ Miscellaneous</span>
            <span class="budget-amount">₹${breakdown.miscellaneous}</span>
        </div>
        <div class="budget-item total-budget">
            <span class="budget-category">💰 Total Estimated Cost</span>
            <span class="budget-amount">₹${total}</span>
        </div>
    `;

    document.getElementById('budgetContent').innerHTML = budgetHTML;
    document.getElementById('budgetBreakdown').style.display = 'block';

   
}