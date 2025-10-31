const API_KEY = "AIzaSyCOB8pPmr3BPmacOz-pmGA8ITik5ZFQzvQ"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;


// --- Page Navigation (Updated) ---
function showMainPage() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('appNavbar').style.display = 'flex';
    document.getElementById('mainPageContent').style.display = 'block';
    document.getElementById('resultsPageContent').style.display = 'none';
    document.getElementById('travelForm').reset();
    document.getElementById('itineraryContent').innerHTML = '<div class="loading">Processing your request...</div>';
    document.getElementById('budgetBreakdown').style.display = 'none';
}

function showResultsPage() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('appNavbar').style.display = 'flex';
    document.getElementById('mainPageContent').style.display = 'none';
    document.getElementById('resultsPageContent').style.display = 'block';
}


function estimateAccommodationCost(type, duration) {
    let dailyRate = 0;
    if (type === 'budget') dailyRate = 800;
    else if (type === 'mid-range') dailyRate = 2000;
    else if (type === 'luxury') dailyRate = 5000;
    return dailyRate * duration;
}

function estimateFoodCost(duration, travelers) {
    return 600 * duration * travelers;
}

function estimateTransportCost(duration, travelers) {
    return 300 * duration * travelers;
}

async function handleSubmit(e) {
    e.preventDefault();

    const formData = {
        destination: document.getElementById('destination').value,
        duration: parseInt(document.getElementById('duration').value),
        budget: parseInt(document.getElementById('budget').value),
        travelers: parseInt(document.getElementById('travelers').value),
        travelType: document.getElementById('travelType').value,
        accommodation: document.getElementById('accommodation').value,
        specificSpots: document.getElementById('specificSpots').value,
        preferences: document.getElementById('preferences').value
    };

    displaySummary(formData);
    showResultsPage();
    document.getElementById('itineraryContent').innerHTML = '<div class="loading">Generating activity list from AI...</div>';
    document.getElementById('budgetBreakdown').style.display = 'none';

    try {
        const accommodationCost = estimateAccommodationCost(formData.accommodation, formData.duration);
        const foodCost = estimateFoodCost(formData.duration, formData.travelers);
        const transportCost = estimateTransportCost(formData.duration, formData.travelers);
        const fixedCosts = accommodationCost + foodCost + transportCost;

        const activityBudget = formData.budget - fixedCosts;

        if (activityBudget <= 0) {
            throw new Error(`Your budget (₹${formData.budget}) is too low to cover estimated fixed costs of ₹${fixedCosts} (accommodation, food, transport). Please increase your budget.`);
        }
        
        document.getElementById('itineraryContent').innerHTML = `<div class="loading">Fixed costs estimated at ₹${fixedCosts}.<br/>Running Knapsack algorithm with remaining activity budget of ₹${activityBudget}...</div>`;

        const allActivities = await fetchActivitiesFromAI(formData.destination, activityBudget, formData.specificSpots);

        const { selectedItems, totalValue, totalCost: knapsackActivityCost } = solveKnapsack(allActivities, activityBudget);

        if (selectedItems.length === 0) {
             throw new Error(`No activities could be selected with your remaining budget of ₹${activityBudget}. Try increasing your budget.`);
        }
        displayItinerary(
            selectedItems,
            formData.duration,
            totalValue,
            knapsackActivityCost,
            allActivities.length,
            activityBudget
        );
        
        displayBudgetBreakdown(
            accommodationCost, 
            foodCost, 
            transportCost, 
            knapsackActivityCost, 
            formData.budget
        );

    } catch (error) {
        console.error("Error generating itinerary:", error);
        document.getElementById('itineraryContent').innerHTML = `<p style="color: red; text-align: center;">⚠️ Failed to generate itinerary: ${error.message}</p>`;
    }
}


// --- STEP 1: Fetch ACTIVITIES (not itinerary) from Google AI ---
async function fetchActivitiesFromAI(destination, activityBudget, specificSpots) {
    const prompt = `
        You are a travel data expert. A user is planning a trip to ${destination} and has a budget of ₹${activityBudget} for activities.
        Their specific requests include: ${specificSpots || 'None'}.

        Generate a JSON array of 15-20 *real* local activities, attractions, and experiences for ${destination}.
        Include famous places like "Cellular Jail" if relevant.
        For each activity, provide:
        1.  "name": The real name of the activity/place.
        2.  "description": A very short description.
        3.  "cost": An estimated cost in ₹. The cost *must* be a number.
        4.  "value": A score from 1-100 representing how "good" or "valuable" this activity is (e.g., popularity, user rating).

        The "cost" for most items should be *less than* the total activity budget of ₹${activityBudget}.
        Return ONLY a single, minified JSON array (no "'''json" or other text).
        
        Example format:
        [
          {"name": "Cellular Jail Tour", "description": "Historic prison and light show", "cost": 100, "value": 95},
          {"name": "Scuba Diving at Havelock", "description": "Explore coral reefs", "cost": 3500, "value": 98},
          {"name": "Ross Island Visit", "description": "Ruins and deer sanctuary", "cost": 500, "value": 85}
        ]
    `;

    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("AI API Error:", response.status, errorBody);
        throw new Error(`Failed to fetch AI data. Status: ${response.status}. Check API key and ensure the API is enabled.`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        console.error("AI response blocked or empty:", data);
        // Check for safety ratings
        if (data.promptFeedback) {
             console.error("Prompt feedback:", data.promptFeedback);
             throw new Error("AI response was blocked due to safety settings. Check your prompt.");
        }
        throw new Error("AI response was blocked or empty. Try a different prompt.");
    }
    
    const aiResponseText = data.candidates[0].content.parts[0].text;
    try {
        const jsonText = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse AI JSON response:", aiResponseText);
        throw new Error("AI returned invalid JSON.");
    }
}

function solveKnapsack(items, capacity) {
    const n = items.length;
    const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const { cost, value } = items[i - 1];
        const itemCost = Number(cost) || 0;
        const itemValue = Number(value) || 0;

        for (let w = 0; w <= capacity; w++) {
            if (itemCost <= w && itemCost > 0) {
                dp[i][w] = Math.max(dp[i - 1][w], itemValue + dp[i - 1][w - itemCost]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    const selectedItems = [];
    let totalValue = dp[n][capacity];
    let totalCost = 0;
    let w = capacity;

    for (let i = n; i > 0 && totalValue > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            const item = items[i - 1];
            const itemCost = Number(item.cost) || 0;
            const itemValue = Number(item.value) || 0;
            
            if (itemValue > 0 && itemCost > 0) {
                selectedItems.push(item);
                totalValue -= itemValue;
                totalCost += itemCost;
                w -= itemCost;
            }
        }
    }

    return { 
        selectedItems: selectedItems.reverse(),
        totalValue: dp[n][capacity],
        totalCost: totalCost 
    };
}


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
            <span class="summary-label">Total Budget:</span>
            <span class="summary-value">₹${data.budget}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Travelers:</span>
            <span class="summary-value">${data.travelers} person(s)</span>
        </div>
    `;
    document.getElementById('summaryContent').innerHTML = summaryHTML;
}


function displayItinerary(selectedItems, duration, totalValue, totalCost, numActivities, activityBudget) {
    
    let itineraryHTML = '';
    const itemsPerDay = Math.ceil(selectedItems.length / duration);

    for (let i = 0; i < duration; i++) {
        const dayLabel = `Day ${i + 1}`;
        const startIndex = i * itemsPerDay;
        const endIndex = startIndex + itemsPerDay;
        const dayActivities = selectedItems.slice(startIndex, endIndex);

        itineraryHTML += `
            <div class="day-card">
                <div class="day-header">
                    <span>📅</span>
                    <span>${dayLabel}</span>
                </div>
                <div class="activity-list">
        `;
        
        if (dayActivities.length > 0) {
            dayActivities.forEach(activity => {
                itineraryHTML += `
                    <div class="activity-item">
                        <div class="activity-time">⭐ ${activity.value} Value</div>
                        <div class="activity-name">${activity.name}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-cost">💰 ₹${activity.cost}</div>
                    </div>
                `;
            });
        } else {
            itineraryHTML += `<p style="padding: 10px; color: #555;">No activities scheduled for this day.</p>`;
        }
        
        itineraryHTML += `
                </div>
            </div>
        `;
    }

    itineraryHTML += `
        <div class="tips-section" style="background: #e6f7ff; border-left-color: #1890ff;">
            <h4 style="color: #0056b3;">🧠 Algorithm Analysis</h4>
            <ul style="color: #333; list-style-type: none; padding-left: 0;">
                <li><strong>Algorithm Used:</strong> 0/1 Knapsack (Dynamic Programming)</li>
                <li><strong>Goal:</strong> Maximize total "value" of activities within the activity budget.</li>
                <li><strong>Time Complexity:</strong> O(N * W)</li>
                
                <li style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                    <strong>Total Value Scored:</strong> ${totalValue}
                </li>
                <li>
                    <strong>Total Activity Cost:</strong> ₹${totalCost}
                </li>
            </ul>
        </div>
    `;

    document.getElementById('itineraryContent').innerHTML = itineraryHTML;
}

function displayBudgetBreakdown(accommodation, food, transport, activities, totalBudget) {
    
    const fixedCosts = accommodation + food + transport;
    const totalSpent = fixedCosts + activities;
    const miscellaneous = totalBudget - totalSpent;

    let budgetHTML = `
        <div class="budget-item">
            <span class="budget-category">🏨 Accommodation</span>
            <span class="budget-amount">₹${accommodation}</span>
        </div>
        <div class="budget-item">
            <span class="budget-category">🍽️ Food & Dining</span>
            <span class="budget-amount">₹${food}</span>
        </div>
         <div class="budget-item">
            <span class="budget-category">🚗 Local Transport</span>
            <span class="budget-amount">₹${transport}</span>
        </div>
        <div class="budget-item">
            <span class="budget-category">🎯 Activities (from Knapsack)</span>
            <span class="budget-amount">₹${activities}</span>
        </div>
    `;

    if (miscellaneous >= 0) {
         budgetHTML += `
         <div class="budget-item" style="background: #e6ffed; border-left: 4px solid #52c41a;">
            <span class="budget-category">🛍️ Remaining (for Shopping/Misc)</span>
            <span class="budget-amount">₹${miscellaneous}</span>
        </div>
        `;
    } else {
         budgetHTML += `
         <div class="budget-item" style="background: #fff1f0; border-left: 4px solid #f5222d;">
            <span class="budget-category">🔥 Over Budget By</span>
            <span class="budget-amount" style="color: #f5222d;">₹${Math.abs(miscellaneous)}</span>
        </div>
        `;
    }

    budgetHTML += `
        <div class="budget-item total-budget" style="margin-top: 10px;">
            <span class="budget-category">💰 Total Budget</span>
            <span class="budget-amount">₹${totalBudget}</span>
        </div>
        <div class="budget-item total-budget" style="background: #f0f0f0; color: #333;">
            <span class="budget-category">💸 Total Estimated Cost</span>
            <span class="budget-amount" style="color: #333;">₹${totalSpent}</span>
        </div>
    `;


    document.getElementById('budgetContent').innerHTML = budgetHTML;
    document.getElementById('budgetBreakdown').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    const travelForm = document.getElementById('travelForm');
    if (travelForm) {
        travelForm.addEventListener('submit', handleSubmit);
    } else {
        console.error("Could not find travelForm element!");
    }
});
