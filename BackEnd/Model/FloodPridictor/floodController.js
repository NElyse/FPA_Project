// controllers/floodController.js
const axios = require("axios");

exports.predictFlood = async (req, res) => {
  try {
    const flaskResponse = await axios.post("http://127.0.0.1:5000/predict", req.body);

    const { prediction, probability } = flaskResponse.data;

    res.status(200).json({
      prediction,
      probability,
    });
  } catch (err) {
    console.error("❌ Error calling Flask API:", err.message);
    res.status(500).json({ error: "Failed to predict flood risk" });
  }
};
