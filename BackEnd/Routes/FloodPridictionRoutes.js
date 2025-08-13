const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("../config/db");
const { predictFlood } = require("../Model/FloodPridictor/floodController");

// === POST /predict ===
router.post("/predict", predictFlood);

// === Constants ===
const validationRules = {
  rainfall_mm: { min: 0, max: 100, label: "Rainfall (mm)" },
  water_level_m: { min: 0, max: 3.5, label: "Water Level (m)" },
  soil_moisture: { min: 0, max: 100, label: "Soil Moisture (%)" },
  temp_c: { min: -50, max: 60, label: "Temperature (°C)" },
  humidity: { min: 0, max: 100, label: "Humidity (%)" },
  wind_speed: { min: 0, max: 50, label: "Wind Speed (km/h)" },
  pressure: { min: 100, max: 1100, label: "Atmospheric Pressure (hPa)" },
};

const seasonOptions = [
  "Long Rainy Season",
  "Short Rainy Season",
  "Long Dry Season",
  "Short Dry Season",
];

const locationOptions = ["lowland", "middleland", "upland"];

// === Validation Function ===
function validatePredictionData(data) {
  const errors = [];

  // Date validation and no past date allowed
  if (!data.prediction_date || isNaN(Date.parse(data.prediction_date))) {
    errors.push("Valid prediction_date is required.");
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(data.prediction_date);
    if (selectedDate < today) {
      errors.push("Prediction date cannot be in the past.");
    }
  }

  // Numeric fields
  for (const [key, rule] of Object.entries(validationRules)) {
    const val = data[key];
    if (val === undefined || val === null || val === "") {
      errors.push(`${rule.label} is required.`);
    } else if (typeof val !== "number" || isNaN(val)) {
      errors.push(`${rule.label} must be a number.`);
    } else if (val < rule.min || val > rule.max) {
      errors.push(`${rule.label} must be between ${rule.min} and ${rule.max}.`);
    }
  }

  // Boolean fields
  ["has_river", "has_lake", "has_poor_drainage", "is_urban", "is_deforested"].forEach((field) => {
    if (typeof data[field] !== "boolean") {
      errors.push(`${field} must be a boolean.`);
    }
  });

  // Enums
  if (!seasonOptions.includes(data.season)) {
    errors.push(`Season must be one of: ${seasonOptions.join(", ")}`);
  }

  if (!locationOptions.includes(data.location_type)) {
    errors.push(`Location type must be one of: ${locationOptions.join(", ")}`);
  }

  // Prediction result
  if (!["Flood Risk", "Low Risk"].includes(data.prediction_result)) {
    errors.push("prediction_result must be either 'Flood Risk' or 'Low Risk'.");
  }

  // Probability
  if (
    typeof data.prediction_probability !== "number" ||
    data.prediction_probability < 0 ||
    data.prediction_probability > 1
  ) {
    errors.push("prediction_probability must be a number between 0 and 1.");
  }

  // User ID
  if (!data.user_id || typeof data.user_id !== "number" || data.user_id <= 0) {
    errors.push("Valid user_id is required.");
  }

  // Optional: prediction_location
  if (data.prediction_location !== undefined && data.prediction_location !== null) {
    if (typeof data.prediction_location !== "string") {
      errors.push("prediction_location must be a string.");
    } else if (data.prediction_location.length > 30) {
      errors.push("prediction_location cannot exceed 30 characters.");
    }
  }

  return errors;
}

// === POST /save-prediction ===
router.post("/save-prediction", async (req, res) => {
  try {
    const data = req.body;

    console.log("📨 Incoming prediction data:", data);

    // Convert string booleans to real booleans
    ["has_river", "has_lake", "has_poor_drainage", "is_urban", "is_deforested"].forEach((key) => {
      if (typeof data[key] === "string") data[key] = data[key].toLowerCase() === "true";
    });

    // Convert string numbers to real numbers
    Object.keys(validationRules).forEach((key) => {
      if (data[key] !== undefined) data[key] = Number(data[key]);
    });

    if (data.user_id && typeof data.user_id === "string") {
      data.user_id = Number(data.user_id);
    }

    if (data.prediction_probability && typeof data.prediction_probability === "string") {
      data.prediction_probability = Number(data.prediction_probability);
    }

    // === Validate fields ===
    const errors = validatePredictionData(data);
    if (errors.length > 0) {
      console.log("❌ Validation errors:", errors);
      return res.status(400).json({ errors });
    }

    // === Save to DB ===
    await poolConnect;
    const request = pool.request();

    await request
      .input("prediction_date", sql.Date, data.prediction_date)
      .input("season", sql.NVarChar(50), data.season)
      .input("location_type", sql.NVarChar(50), data.location_type)
      .input("rainfall_mm", sql.Float, data.rainfall_mm)
      .input("water_level_m", sql.Float, data.water_level_m)
      .input("soil_moisture", sql.Float, data.soil_moisture)
      .input("temp_c", sql.Float, data.temp_c)
      .input("humidity", sql.Float, data.humidity)
      .input("wind_speed", sql.Float, data.wind_speed)
      .input("pressure", sql.Float, data.pressure)
      .input("has_river", sql.Bit, data.has_river)
      .input("has_lake", sql.Bit, data.has_lake)
      .input("has_poor_drainage", sql.Bit, data.has_poor_drainage)
      .input("is_urban", sql.Bit, data.is_urban)
      .input("is_deforested", sql.Bit, data.is_deforested)
      .input("prediction_result", sql.NVarChar(50), data.prediction_result)
      .input("prediction_probability", sql.Float, data.prediction_probability)
      .input("user_id", sql.Int, data.user_id)
      .input("prediction_location", sql.NVarChar(30), data.prediction_location || null)
      .query(`
        INSERT INTO [FloodPredictions] (
          prediction_date, season, location_type,
          rainfall_mm, water_level_m, soil_moisture,
          temp_c, humidity, wind_speed, pressure,
          has_river, has_lake, has_poor_drainage,
          is_urban, is_deforested, prediction_result,
          prediction_probability, user_id, created_at,
          prediction_location
        )
        VALUES (
          @prediction_date, @season, @location_type,
          @rainfall_mm, @water_level_m, @soil_moisture,
          @temp_c, @humidity, @wind_speed, @pressure,
          @has_river, @has_lake, @has_poor_drainage,
          @is_urban, @is_deforested, @prediction_result,
          @prediction_probability, @user_id, GETDATE(),
          @prediction_location
        )
      `);

    console.log(`✅ Prediction saved for user ID ${data.user_id}`);
    res.status(200).json({ message: "Prediction saved successfully." });

  } catch (err) {
    console.error("🔥 Internal Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
