from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

# Load trained Random Forest model
model = pickle.load(open("../randomModel_flood_prediction_model.pkl", "rb"))

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

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    # Map season string to integer code, default to 1
    season_str = data.get('season', 'Long Rainy Season')
    season = season_mapping.get(season_str, 1)

    # Map location_type string to integer code, default to 1
    location_str = data.get('location_type', 'lowland').lower()
    location_type = location_mapping.get(location_str, 1)

    features = np.array([[
        float(data.get('rainfall_mm', 0)),
        float(data.get('water_level_m', 0)),
        float(data.get('soil_moisture', 0)),
        float(data.get('temp_c', 0)),
        float(data.get('humidity', 0)),
        float(data.get('wind_speed', 0)),
        float(data.get('pressure', 0)),
        int(data.get('has_river', False)),
        int(data.get('has_lake', False)),
        int(data.get('has_poor_drainage', False)),
        int(data.get('is_urban', False)),
        int(data.get('is_deforested', False)),
        season,
        location_type
    ]])

    probability = model.predict_proba(features)[0][1]
    prediction = int(probability >= 0.5)

    return jsonify({
        "prediction": prediction,
        "probability": float(probability)
    })

if __name__ == "__main__":
    app.run(debug=True)
