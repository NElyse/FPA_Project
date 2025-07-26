import React, { useState } from "react";
import axios from "axios";
import "../CSS/FloodPredictionForm.css";

const seasonOptions = [
  "Long Rainy Season",
  "Short Rainy Season",
  "Long Dry Season",
  "Short Dry Season",
];

const locationOptions = ["lowland", "middleland", "upland"];

const validationRules = {
  rainfall_mm: { min: 0, max: 100, label: "Rainfall (mm)" },
  water_level_m: { min: 0, max: 3.5, label: "Water Level (m)" },
  soil_moisture: { min: 0, max: 100, label: "Soil Moisture (%)" },
  temp_c: { min: -50, max: 60, label: "Temperature (°C)" },
  humidity: { min: 0, max: 100, label: "Humidity (%)" },
  wind_speed: { min: 0, max: 50, label: "Wind Speed (km/h)" },
  pressure: { min: 100, max: 1100, label: "Atmospheric Pressure (hPa)" },
};

const classifySeason = (dateString) => {
  if (!dateString) return null;
  const month = new Date(dateString).getMonth() + 1;
  if (month >= 3 && month <= 5) return "Long Rainy Season";
  if (month >= 9 && month <= 11) return "Short Rainy Season";
  if (month >= 6 && month <= 8) return "Long Dry Season";
  return "Short Dry Season";
};

const FloodPredictionForm = () => {
  const [formData, setFormData] = useState({
    prediction_date: "",
    rainfall_mm: "",
    water_level_m: "",
    soil_moisture: "",
    temp_c: "",
    humidity: "",
    wind_speed: "",
    pressure: "",
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
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [seasonWasAutoSet, setSeasonWasAutoSet] = useState(false);

  const validate = () => {
    const newErrors = {};
    for (const [key, rule] of Object.entries(validationRules)) {
      const value = formData[key];
      if (value === "" || value === null || value === undefined) {
        newErrors[key] = `${rule.label} is required.`;
      } else if (isNaN(value)) {
        newErrors[key] = `${rule.label} must be a number.`;
      } else if (value < rule.min || value > rule.max) {
        newErrors[key] = `${rule.label} must be between ${rule.min} and ${rule.max}.`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "prediction_date" && value) {
        updated.season = classifySeason(value);
        setSeasonWasAutoSet(true);
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }

    setError("");
    setSuccess("");
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validate()) {
      setResult(null);
      setError("❌ Please fix validation errors before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/FloodPridictionRoutes/predict",
        formData
      );
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Please check the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!result) {
      setError("❌ No prediction available to save.");
      return;
    }

    if (!formData.prediction_date) {
      setError("❌ Please select a Prediction Date to save.");
      return;
    }

    const userString = localStorage.getItem("user");
    if (!userString) {
      setError("❌ You must be logged in to save predictions.");
      return;
    }

    const user = JSON.parse(userString);

    setIsLoading(true);
    try {
      const saveData = {
        ...formData,
        prediction_result: result.prediction === 1 ? "Flood Risk" : "Low Risk",
        prediction_probability: result.probability,
        user_id: user.id,
      };

      await axios.post(
        "http://localhost:5000/api/FloodPridictionRoutes/save-prediction",
        saveData
      );
      setSuccess("✅ Prediction saved successfully!");

      setFormData({
        prediction_date: "",
        rainfall_mm: "",
        water_level_m: "",
        soil_moisture: "",
        temp_c: "",
        humidity: "",
        wind_speed: "",
        pressure: "",
        has_river: false,
        has_lake: false,
        has_poor_drainage: false,
        is_urban: false,
        is_deforested: false,
        season: "Long Rainy Season",
        location_type: "lowland",
      });
      setResult(null);
      setSeasonWasAutoSet(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save prediction.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fpa-form-container">
      <h2>🌧️ Flood Risk Prediction</h2>

      <form onSubmit={handlePredict} className="responsive-form">
        <div className="form-row">
          <label>Prediction Date: <span style={{ color: "red" }}>*</span></label>
          <input
            type="date"
            name="prediction_date"
            value={formData.prediction_date}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <label>Season:</label>
          <select
            name="season"
            value={formData.season}
            onChange={handleChange}
            disabled={seasonWasAutoSet}
          >
            {seasonOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>Location Type:</label>
          <select
            name="location_type"
            value={formData.location_type}
            onChange={handleChange}
          >
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {Object.entries(formData).map(([key, value]) => {
          if (["prediction_date", "season", "location_type"].includes(key))
            return null;

          return (
            <div key={key} className="form-row">
              <label>{key.replace(/_/g, " ")}</label>
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
                    <span className="error-text">{errors[key]}</span>
                  )}
                </>
              )}
            </div>
          );
        })}

        {isLoading && <div className="spinner">🔄 Processing...</div>}

        <div className="button-group">
          <button type="submit" disabled={isLoading}>
            Predict
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              isLoading || !result || !formData.prediction_date || !seasonWasAutoSet
            }
          >
            Save Prediction
          </button>
        </div>
      </form>

      {result && (
        <div className="fpa-result">
          <p><strong>Class:</strong> {result.prediction === 1 ? "🚨 Flood Risk" : "✅ Low Risk"}</p>
          <p><strong>Probability:</strong> {result.probability.toFixed(10)}</p>
        </div>
      )}

      {error && <p className="fpa-error">{error}</p>}
      {success && <p className="fpa-success">{success}</p>}
    </div>
  );
};

export default FloodPredictionForm;
