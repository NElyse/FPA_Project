import React, { useState } from "react";
import axios from "axios";

const seasonOptions = [
  "Long Rainy Season",
  "Short Rainy Season",
  "Long Dry Season",
  "Short Dry Season",
];

const locationOptions = ["lowland", "middleland", "upland"];

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

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        {/* Render inputs for numeric and boolean */}
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
            <div key={key}>
              <label>{key.replace(/_/g, " ")}: </label>
              {typeof value === "boolean" ? (
                <input
                  type="checkbox"
                  name={key}
                  checked={value}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type="number"
                  step="any"
                  name={key}
                  value={value}
                  onChange={handleChange}
                />
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
            <strong>Probability:</strong> {result.probability.toFixed(4)}
          </p>
        </div>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default FloodPredictionForm;
