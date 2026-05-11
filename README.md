# Smart Hybrid Renewable Energy Recommender 💡

A web application that recommends the most cost-effective and sustainable hybrid (Solar + Wind) power system based on your location, energy consumption, and budget.

🌐 **Live Demo:** [https://gorgeous-florentine-c2e99d.netlify.app/](https://gorgeous-florentine-c2e99d.netlify.app/)

---

## Features

- 📍 Location-aware analysis using Google Maps API
- ⚡ Recommends optimal Solar, Wind, or Hybrid energy mix
- 💰 Budget-based cost optimization with budget status indicator
- 📊 Visual charts for energy mix and seasonal output (Chart.js)
- 🌍 CO2 reduction and annual savings estimation
- 📱 Responsive design

---

## Tech Stack

**Frontend:**
- HTML, CSS, JavaScript
- Google Maps API
- Chart.js

**Backend:**
- Node.js
- Express.js

**Deployment:**
- Frontend: [Netlify](https://www.netlify.com/)
- Backend: [Render](https://render.com/)

---

## How It Works

1. User selects a location on the interactive map
2. User enters monthly energy consumption, budget, and preferred system type
3. Frontend sends the data to the backend API
4. Backend calculates the optimal system size, setup cost, annual savings, and CO2 reduction based on regional solar irradiance and wind speed data
5. Results are displayed with interactive charts

---

## API Endpoint

```
POST /api/recommendation
```

**Request Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "consumption": 300,
  "budget": 500000,
  "systemType": "hybrid"
}
```

**Response:**
```json
{
  "region": "south",
  "recommendedMix": "Hybrid: 70% Solar + 30% Wind",
  "systemSize": "3.5 kW Solar | 1.2 kW Wind",
  "setupCost": 354000,
  "annualSavings": 18200,
  "co2Reduction": 1950,
  "isWithinBudget": true
}
```

---

## Running Locally

**Prerequisites:** Node.js installed

**Steps:**

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Smart-hybrid-Energy-Recommender.git

# Navigate to project directory
cd Smart-hybrid-Energy-Recommender

# Install dependencies
npm install

# Start the server
node server.js
```

Then open `http://localhost:3000` in your browser.

---

## Project Structure

```
├── index.html          # Landing page
├── recommender.html    # Main application page
├── script.js           # Frontend logic
├── style.css           # Styling
├── server.js           # Backend API server
└── package.json        # Dependencies
```

---

## Live Links

| Service | URL |
|---|---|
| Frontend | https://gorgeous-florentine-c2e99d.netlify.app/ |
| Backend API | https://smart-hybrid-energy-recommender.onrender.com |
