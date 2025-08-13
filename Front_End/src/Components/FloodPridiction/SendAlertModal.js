import React, { useEffect, useState } from "react";
import '../CSS/Modal.css';

const SendAlertModal = ({ isOpen, onClose, predictionResult, onSend }) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (predictionResult) {
      const probability = (predictionResult.prediction_probability * 100).toFixed(2);
      const defaultMsg =
        predictionResult.prediction_result === "Flood Risk"
          ? `🚨 Alert: High flood risk predicted in ${predictionResult.prediction_location} with ${probability}% probability. Please take necessary precautions.`
          : `✅ Info: Low flood risk predicted in ${predictionResult.prediction_location}. Stay safe.`;

      setMessage(defaultMsg);
    }
  }, [predictionResult]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <h3>Send Flood Alert</h3>
        <textarea
          rows={6}
          value={message}
          onChange={(e) => {
            console.log("Modal message changed:", e.target.value);
            setMessage(e.target.value);
          }}
        />
        <div className="modal-buttons">
          <button onClick={() => onSend(message)}>✅ Confirm Send</button>
          <button onClick={onClose} style={{ marginLeft: "10px" }}>❌ Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SendAlertModal;
