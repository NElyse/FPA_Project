const express = require("express");
const router = express.Router();
const { predictFlood } = require("../Model/FloodPridictor/floodController");

router.post("/predict", predictFlood);

module.exports = router;
