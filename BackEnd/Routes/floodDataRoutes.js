const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get Flood Data
router.get('/selectFloodData', async (req, res) => {
  try {
    const [results] = await db.execute(
      'SELECT id, water_level, rainfall, flood_risk, recorded_at FROM flood_data ORDER BY id DESC'
    );
    res.json(results);
  } catch (err) {
    res.status(500).send('Error fetching data');
  }
});

// Get Flood Status
router.get('/selectFloodStatus', async (req, res) => {
  try {
    const [results] = await db.execute(
      'SELECT id, risk_level, location, timestamp FROM flood_status ORDER BY timestamp DESC'
    );
    if (results.length === 0)
      return res.status(404).json({ message: 'No flood status records found' });
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching data' });
  }
});

module.exports = router;
