from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

# Load model and scaler
model = pickle.load(open("../randomModel_flood_prediction_model.pkl", "rb"))
scaler = pickle.load(open("../scaler.pkl", "rb"))

season_mapping = {
    "Long Rainy Season": 1,
    "Short Rainy Season": 2,
    "Long Dry Season": 3,
    "Short Dry Season": 4
}

location_mapping = {
    "lowland": 1,
    "middleland": 2,
    "upland": 3
}

def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    # Map season and location_type strings to integers with defaults
    season_str = data.get('season', 'Long Rainy Season')
    season = season_mapping.get(season_str, 1)

    location_str = data.get('location_type', 'lowland').lower()
    location_type = location_mapping.get(location_str, 1)

    # Extract, validate and clip numeric inputs
    rainfall = safe_float(data.get('rainfall_mm'))
    rainfall = min(max(rainfall, 0), 100)

    water_level = safe_float(data.get('water_level_m'))
    water_level = min(max(water_level, 0.3), 3.5)

    soil_moisture = safe_float(data.get('soil_moisture'))
    soil_moisture = min(max(soil_moisture, 20), 100)

    temp_c = safe_float(data.get('temp_c'))

    humidity = safe_float(data.get('humidity'))
    humidity = min(max(humidity, 30), 100)

    wind_speed = safe_float(data.get('wind_speed'))
    pressure = safe_float(data.get('pressure'))

    # Boolean features
    has_river = int(data.get('has_river', False))
    has_lake = int(data.get('has_lake', False))
    has_poor_drainage = int(data.get('has_poor_drainage', False))
    is_urban = int(data.get('is_urban', False))
    is_deforested = int(data.get('is_deforested', False))

    features = np.array([[
        rainfall,
        water_level,
        soil_moisture,
        temp_c,
        humidity,
        wind_speed,
        pressure,
        has_river,
        has_lake,
        has_poor_drainage,
        is_urban,
        is_deforested,
        season,
        location_type
    ]])

    # Scale features
    features_scaled = scaler.transform(features)

    # Predict flood probability
    probability = model.predict_proba(features_scaled)[0][1]

    # Clamp probability to avoid exact 0 or 1
    epsilon = 1e-6
    probability = max(min(probability, 1 - epsilon), epsilon)

    prediction = int(probability >= 0.5)

    return jsonify({
        "prediction": prediction,
        "probability": float(f"{probability:.10f}")
    })

if __name__ == "__main__":
    app.run(debug=True)
