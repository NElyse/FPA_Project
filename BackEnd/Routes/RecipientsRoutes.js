const express = require('express');
const router = express.Router();
const { sql, pool, poolConnect } = require('../config/db');

// routes/RecipientsRoutes.js
router.post("/register-recipient", async (req, res) => {
  await poolConnect;

  const { full_name, phone, email, sector, recipient_type } = req.body;
  const userId = req.headers["user-id"];

  // Log request received
  console.log("📥 Register recipient request received");
  console.log("Request body:", req.body);
  console.log("User ID from headers:", userId);

  if (!userId) {
    console.warn("⚠️ Missing user ID in headers");
    return res.status(400).json({ error: "Missing user ID" });
  }

  // Basic validation
  if (!full_name || !phone || !sector || !recipient_type || !email) {
    console.warn("⚠️ Missing required fields in request body");
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const request = pool.request();
    request.input("full_name", sql.VarChar, full_name);
    request.input("phone", sql.VarChar, phone);
    request.input("email", sql.VarChar, email);
    request.input("sector", sql.VarChar, sector);
    request.input("recipient_type", sql.VarChar, recipient_type);
    request.input("user_id", sql.Int, userId);

    console.log("📤 Executing INSERT INTO AlertRecipients...");

    const result = await request.query(`
      INSERT INTO AlertRecipients (full_name, phone, email, location, recipient_type, registered_by, created_at)
      VALUES (@full_name, @phone, @email, @sector, @recipient_type, @user_id, GETDATE())
    `);

    console.log("✅ Insert successful:", result.rowsAffected);

    res.status(200).json({ message: "Recipient registered successfully" });
  } catch (err) {
    console.error("❌ Error inserting recipient into database:", err);
    res.status(500).json({
      error: err.message || "Internal server error while registering recipient",
    });
  }
});




router.get("/recipients", async (req, res) => {
  await poolConnect;
  const userId = req.headers["user-id"];
  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const request = pool.request();
    request.input("user_id", sql.Int, userId);

    const result = await request.query(`
      SELECT TOP 1000
        id,
        full_name,
        phone,
        location,
        recipient_type,
        registered_by,
        email,
        created_at
      FROM AlertRecipients
      WHERE registered_by = @user_id
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching recipients:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;