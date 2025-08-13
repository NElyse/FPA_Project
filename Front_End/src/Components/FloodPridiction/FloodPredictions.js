import React, { useEffect, useState } from "react";
import axios from "axios";
import SendAlertModal from "./SendAlertModal";
import "../CSS/FloodData.css";

const FloodData = () => {
  const [floodData, setFloodData] = useState([]);
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [sendSuccess, setSendSuccess] = useState("");

  useEffect(() => {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;

    if (!user || !user.id) {
      setError("User not logged in");
      return;
    }

    axios
      .get("http://localhost:5000/api/floodDataRoutes/selectFloodData", {
        headers: { "user-id": user.id },
      })
      .then((response) => setFloodData(response.data))
      .catch((err) => {
        console.error("Error fetching flood data:", err);
        setError("Failed to fetch flood data");
      });
  }, []);

  const handleOpenModal = (data) => {
    setSelectedData(data);
    setShowModal(true);
    setSendSuccess("");
  };

const handleSendAlert = async (customMessage) => {
  try {
    setSendingId(selectedData.id);
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;

    if (!user) throw new Error("Not logged in");
const payload = {
  user_id: user.id,
  message: customMessage,
  prediction_id: selectedData.id,
  sector: selectedData.prediction_location,
  probability: selectedData.prediction_probability,
  prediction_result: selectedData.prediction_result,
  prediction_date: selectedData.prediction_date,
};


    await axios.post("http://localhost:5000/api/SendAlertRoutes/send-alert", payload);

    setSendSuccess("✅ Alert sent successfully!");
    setShowModal(false);
  } catch (err) {
    console.error("Error sending alert details:", err);
    if (err.response) {
      console.error("Response data:", err.response.data);
      alert(`❌ Failed to send alert: ${err.response.data.error || JSON.stringify(err.response.data)}`);
    } else if (err.request) {
      alert("❌ No response received from server.");
    } else {
      alert(`❌ Error: ${err.message}`);
    }
  } finally {
    setSendingId(null);
  }
};


  if (error) return <p className="error-text">{error}</p>;
  if (floodData.length === 0) return <p>No flood prediction data available.</p>;

  return (
    <div className="flood-data-container">
      <h2>📊 Recent Flood Predictions</h2>
      <div className="cards-container">
        {floodData.map((data) => {
          const probability = data.prediction_probability * 100;
          const isDanger = probability > 70;

          return (
            <div
              key={data.id}
              className={`flood-card ${isDanger ? "danger-border" : ""}`}
            >
              <div className="date-text">
                Prediction Date:{" "}
                {new Date(data.prediction_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              <div className="location-text">
                📍 Location: {data.prediction_location || "N/A"}
              </div>

              <div className="data-section">
                <div className="data-card">
                  <div className="data-card-title">Rainfall</div>
                  <div className="data-card-value">{data.rainfall_mm} mm</div>
                </div>
                <div className="data-card">
                  <div className="data-card-title">Temperature</div>
                  <div className="data-card-value">{data.temp_c} °C</div>
                </div>
                <div className="data-card">
                  <div className="data-card-title">Humidity</div>
                  <div className="data-card-value">{data.humidity} %</div>
                </div>
                <div className="data-card">
                  <div className="data-card-title">Wind Speed</div>
                  <div className="data-card-value">{data.wind_speed} km/h</div>
                </div>
                <div className="data-card">
                  <div className="data-card-title">Flood Risk</div>
                  <div className="data-card-value">{data.prediction_result}</div>
                </div>
              </div>

              <div className="probability">
                <strong>Probability:</strong> {probability.toFixed(2)}%
              </div>

              <button
                className="send-alert-btn"
                onClick={() => handleOpenModal(data)}
                disabled={sendingId === data.id}
              >
                {sendingId === data.id ? "Sending Alert..." : "🚨 Send Alert"}
              </button>
            </div>
          );
        })}
      </div>

      {selectedData && (
        <SendAlertModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          predictionResult={selectedData}
          onSend={handleSendAlert}
        />
      )}

      {sendSuccess && <p className="fpa-success">{sendSuccess}</p>}
    </div>
  );
};

export default FloodData;
