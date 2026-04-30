const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ================================================================
// SOLAR IRRADIANCE DATA BY REGION (in kWh/m²/day)
// ================================================================
const solarIrradianceData = {
    'north': 4.5,      // Northern India
    'south': 5.5,      // Southern India
    'east': 4.8,       // Eastern India
    'west': 5.2,       // Western India
    'northeast': 4.2,  // Northeast India
    'central': 5.0     // Central India
};

const windSpeedData = {
    'north': 4.5,      // m/s
    'south': 6.2,
    'east': 5.1,
    'west': 6.8,
    'northeast': 3.9,
    'central': 5.3
};

// ================================================================
// HELPER FUNCTION: Determine Region from Coordinates
// ================================================================
function getRegionFromCoordinates(latitude, longitude) {
    // Simplified region mapping based on lat/long
    if (latitude > 28) {
        return longitude < 77 ? 'north' : 'northeast';
    } else if (latitude > 23) {
        return longitude < 77 ? 'central' : 'east';
    } else if (latitude > 15) {
        return longitude < 77 ? 'west' : 'south';
    }
    return 'south';
}

// ================================================================
// HELPER FUNCTION: Calculate Solar System Size
// ================================================================
function calculateSolarSize(monthlyConsumption, irradiance) {
    // Formula: System Size (kW) = (Monthly Consumption * 1000) / (irradiance * 30 * 0.75)
    // 0.75 is the system efficiency factor
    const systemSize = (monthlyConsumption * 1000) / (irradiance * 30 * 0.75);
    return Math.round(systemSize * 100) / 100;
}

// ================================================================
// HELPER FUNCTION: Calculate Wind System Size
// ================================================================
function calculateWindSize(monthlyConsumption, windSpeed) {
    // Simplified: Wind output depends on wind speed (v³)
    // Average wind turbine: ~0.5 kW per m/s wind speed cubed factor
    const windFactor = (windSpeed / 10) * 2; // Normalized factor
    const systemSize = monthlyConsumption / (windFactor * 30 * 0.6); // 0.6 efficiency
    return Math.round(systemSize * 100) / 100;
}

// ================================================================
// HELPER FUNCTION: Calculate Annual Output
// ================================================================
function calculateAnnualOutput(solarSize, windSize, irradiance, windSpeed) {
    const solarOutput = solarSize * irradiance * 365 * 0.75; // kWh/year
    const windOutput = windSize * windSpeed * 365 * 0.6; // Simplified
    return Math.round(solarOutput + windOutput);
}

// ================================================================
// HELPER FUNCTION: Calculate Setup Cost
// ================================================================
function calculateSetupCost(solarSize, windSize, budget) {
    // Average costs in India
    const solarCostPerKW = 60000; // ₹/kW
    const windCostPerKW = 120000; // ₹/kW

    const solarCost = solarSize * solarCostPerKW;
    const windCost = windSize * windCostPerKW;
    const totalCost = solarCost + windCost;

    return {
        total: Math.round(totalCost),
        solar: Math.round(solarCost),
        wind: Math.round(windCost),
        isWithinBudget: totalCost <= budget
    };
}

// ================================================================
// HELPER FUNCTION: Get Energy Mix Recommendation
// ================================================================
function getEnergyMix(systemType, region, windSpeed, irradiance) {
    const energyMix = [];

    if (systemType === 'solar' || systemType === 'hybrid') {
        energyMix.push({
            type: 'Solar',
            value: systemType === 'solar' ? 100 : 70
        });
    }

    if (systemType === 'wind' || systemType === 'hybrid') {
        energyMix.push({
            type: 'Wind',
            value: systemType === 'wind' ? 100 : 30
        });
    }

    if (energyMix.length === 0) {
        energyMix.push({ type: 'Solar', value: 100 });
    }

    return energyMix;
}

// ================================================================
// HELPER FUNCTION: Generate Seasonal Data
// ================================================================
function generateSeasonalData(solarSize, windSize, irradiance, windSpeed) {
    return [
        {
            season: 'Summer',
            output: Math.round((solarSize * irradiance * 1.2 + windSize * windSpeed * 0.8) * 30)
        },
        {
            season: 'Monsoon',
            output: Math.round((solarSize * irradiance * 0.6 + windSize * windSpeed * 1.5) * 30)
        },
        {
            season: 'Winter',
            output: Math.round((solarSize * irradiance * 0.9 + windSize * windSpeed * 0.9) * 30)
        }
    ];
}

// ================================================================
// API ENDPOINT: /api/recommendation
// ================================================================
app.post('/api/recommendation', (req, res) => {
    try {
        const { latitude, longitude, consumption, budget, systemType } = req.body;

        // Validation
        if (!latitude || !longitude || !consumption || !budget || !systemType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const monthlyConsumption = parseFloat(consumption);
        const budgetLimit = parseFloat(budget);

        // Get region and resource data
        const region = getRegionFromCoordinates(lat, lon);
        const irradiance = solarIrradianceData[region];
        const windSpeed = windSpeedData[region];

        // Calculate system sizes
        let solarSize = 0;
        let windSize = 0;

        if (systemType === 'solar') {
            solarSize = calculateSolarSize(monthlyConsumption, irradiance);
        } else if (systemType === 'wind') {
            windSize = calculateWindSize(monthlyConsumption, windSpeed);
        } else if (systemType === 'hybrid') {
            solarSize = calculateSolarSize(monthlyConsumption * 0.7, irradiance);
            windSize = calculateWindSize(monthlyConsumption * 0.3, windSpeed);
        }

        // Calculate costs
        const costs = calculateSetupCost(solarSize, windSize, budgetLimit);

        // Get energy mix
        const energyMix = getEnergyMix(systemType, region, windSpeed, irradiance);

        // Generate seasonal data
        const seasonalData = generateSeasonalData(solarSize, windSize, irradiance, windSpeed);

        // Calculate annual savings (assuming ₹8/kWh average cost)
        const annualOutput = calculateAnnualOutput(solarSize, windSize, irradiance, windSpeed);
        const annualSavings = annualOutput * 8;

        // CO2 reduction (1 kWh = ~0.85 kg CO2 offset)
        const co2Reduction = Math.round(annualOutput * 0.85);

        // Build recommendation string
        let recommendedMix = '';
        if (systemType === 'solar') {
            recommendedMix = `Solar Only: ${solarSize} kW`;
        } else if (systemType === 'wind') {
            recommendedMix = `Wind Only: ${windSize} kW`;
        } else {
            recommendedMix = `Hybrid: 70% Solar (${solarSize} kW) + 30% Wind (${windSize} kW)`;
        }

        // Response
        res.json({
            region,
            recommendedMix,
            systemSize: `${solarSize} kW Solar | ${windSize} kW Wind`,
            setupCost: costs.total,
            annualSavings: Math.round(annualSavings),
            co2Reduction,
            energyMix,
            seasonalData,
            isWithinBudget: costs.isWithinBudget
        });

    } catch (error) {
        console.error('Error processing recommendation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ================================================================
// SERVE STATIC FILES (HTML, CSS, JS)
// ================================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'recommender.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ================================================================
// START SERVER
// ================================================================
app.listen(PORT, () => {
    console.log(`🚀 Smart Energy Recommender Server running on http://localhost:${PORT}`);
    console.log(`📍 Open http://localhost:${PORT} in your browser`);
});
