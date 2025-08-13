const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');

// Get user-specific flood predictions
router.get('/selectFloodData', async (req, res) => {
  await poolConnect;

  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(400).json({ error: 'Missing user ID in header' });
  }

  try {
    const request = pool.request();
    request.input('userId', sql.Int, userId);

    const result = await request.query(`
      SELECT TOP 100
        id,
        prediction_date,
        season,
        location_type,
        rainfall_mm,
        water_level_m,
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
        prediction_result,
        prediction_probability,
        user_id,
        created_at,
        prediction_location
      FROM FloodPredictions
      WHERE user_id = @userId
      ORDER BY prediction_probability DESC
    `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching flood predictions:', err);
    res.status(500).json({ error: 'Error fetching flood predictions' });
  }
});


router.get('/selectFloodStatus', async (req, res) => {
  await poolConnect;

  try {
    const request = pool.request();
    const result = await request.query(`
      SELECT TOP 10
        id,
        prediction_location AS location,
        prediction_result AS risk_level,
        created_at AS timestamp
      FROM FloodPredictions
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.recordset); // Make sure this is an array
  } catch (err) {
    console.error('Error fetching flood status:', err);
    res.status(500).json({ error: 'Failed to fetch flood status' });
  }
});
module.exports = router;