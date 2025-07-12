import React, { useState } from "react";
import axios from "axios";

const seasonOptions = [
  "Long Rainy Season",
  "Short Rainy Season",
  "Long Dry Season",
  "Short Dry Season",
];

const locationOptions = ["lowland", "middleland", "upland"];

// Validation constraints for numeric inputs
const validationRules = {
  rainfall_mm: { min: 0, max: 100 },
  water_level_m: { min: 0, max: 3.5 },
  soil_moisture: { min: 0, max: 100 },
  temp_c: { min: -50, max: 60 },          // reasonable temp range
  humidity: { min: 0, max: 100 },
  wind_speed: { min: 0, max: 50 },
  pressure: { min: 100, max: 1100 },      // typical atmospheric pressure range
};

const FloodPredictionForm = () => {
  const [formData, setFormData] = useState({
    rainfall_mm: 10,
    water_level_m: 0.8,
    soil_moisture: 40,
    temp_c: 24,
    humidity: 60,
    wind_speed: 8,
    pressure: 1012,
    has_river: false,
    has_lake: false,
    has_poor_drainage: false,
    is_urban: false,
    is_deforested: false,
    season: "Long Rainy Season",
    location_type: "lowland",
  });

  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const validate = () => {
    let newErrors = {};

    for (const [key, rules] of Object.entries(validationRules)) {
      const value = parseFloat(formData[key]);
      if (isNaN(value)) {
        newErrors[key] = "Must be a number";
      } else if (value < rules.min || value > rules.max) {
        newErrors[key] = `Value must be between ${rules.min} and ${rules.max}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // valid if no errors
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Optionally clear error for the field on change
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      setResult(null);
      setError("Please fix validation errors before submitting.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/FloodPridictionRoutes/predict",
        formData
      );
      setResult(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Please check the server.");
    }
  };

  return (
    <div>
      <h2>🌧️ Flood Risk Prediction</h2>
      <form onSubmit={handleSubmit}>
        {Object.entries(formData).map(([key, value]) => {
          if (key === "season") {
            return (
              <div key={key}>
                <label>Season: </label>
                <select name="season" value={value} onChange={handleChange}>
                  {seasonOptions.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          if (key === "location_type") {
            return (
              <div key={key}>
                <label>Location Type: </label>
                <select
                  name="location_type"
                  value={value}
                  onChange={handleChange}
                >
                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc.charAt(0).toUpperCase() + loc.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <label>{key.replace(/_/g, " ")}: </label>
              {typeof value === "boolean" ? (
                <input
                  type="checkbox"
                  name={key}
                  checked={value}
                  onChange={handleChange}
                />
              ) : (
                <>
                  <input
                    type="number"
                    step="any"
                    name={key}
                    value={value}
                    onChange={handleChange}
                  />
                  {errors[key] && (
                    <div style={{ color: "red", fontSize: "0.8em" }}>
                      {errors[key]}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
        <button type="submit">Predict</button>
      </form>

      {result && (
        <div>
          <h3>📊 Prediction Result</h3>
          <p>
            <strong>Class:</strong>{" "}
            {result.prediction === 1 ? "🚨 Flood Risk" : "✅ Low Risk"}
          </p>
          <p>
            <strong>Probability:</strong> {result.probability.toFixed(10)}
          </p>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default FloodPredictionForm;
