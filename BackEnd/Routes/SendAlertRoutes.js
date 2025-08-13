const express = require("express");
const router = express.Router();
const { sql, pool, poolConnect } = require("../config/db");
const nodemailer = require("nodemailer");
const axios = require("axios");

// === Mista.io SMS API Token ===
const MISTA_API_TOKEN = process.env.MISTA_API_TOKEN;

// === Email Setup ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post("/send-alert", async (req, res) => {
  const { sector, prediction_result, prediction_date, probability } = req.body;

  console.log("📩 Received /send-alert request with body:", req.body);

  if (!sector || !prediction_result) {
    console.warn("❗ Missing required fields: sector or prediction_result");
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await poolConnect;
    const request = pool.request();
    request.input("sector", sql.VarChar, sector);

    const result = await request.query(`
      SELECT full_name, phone, email, recipient_type
      FROM AlertRecipients
      WHERE location = @sector
    `);

    const recipients = result.recordset;
    console.log(`✅ Found ${recipients.length} recipient(s) in sector "${sector}"`);

    if (!recipients || recipients.length === 0) {
      return res.status(404).json({ message: "No recipients found for this location." });
    }

    const formattedDate = new Date(prediction_date).toLocaleDateString("en-GB");
    const messageEN = `Dear [TYPE], there is an upcoming flood risk predicted in your community (${sector}) on ${formattedDate}. Please take necessary precautions.`;
    const messageRW = `Mwiriwe [TYPE], hari ibyago byo kugwa kw'ibiza (umwuzure) mu Mumurenge wawe (${sector}) ku itariki ya ${formattedDate}. Mwitegure, mwirinde.`;

    let smsSentCount = 0;
    let emailSentCount = 0;

    for (const recipient of recipients) {
      const { full_name, phone, email, recipient_type } = recipient;
      const type = recipient_type || "community member";

      const personalizedMsgRW = messageRW.replace("[TYPE]", type);
      const personalizedMsgEN = messageEN.replace("[TYPE]", type);

      // === Send SMS via Mista.io ===
      if (phone) {
        const formattedPhone = phone.startsWith("+") ? phone : `+25${phone}`;
        try {
          console.log(`📲 Sending SMS to ${formattedPhone} from 'E-Notifier'`);

          const smsResponse = await axios.post(
            "https://api.mista.io/sms",
            {
              to: formattedPhone,
              sender_id: "E-Notifier",
              message: personalizedMsgRW,
              type: "plain",
            },
            {
              headers: {
                Authorization: `Bearer ${MISTA_API_TOKEN}`,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            }
          );

          console.log(`✅ SMS API response for ${formattedPhone}:`, smsResponse.data);
          smsSentCount++;
        } catch (smsErr) {
          console.error(`❌ Failed to send SMS to ${formattedPhone}:`, smsErr.response?.data || smsErr.message);
        }
      } else {
        console.log(`ℹ️ No phone number for ${full_name}`);
      }

      // === Send Email ===
      if (email) {
        try {
          console.log(`📧 Sending email to ${email}`);
          await transporter.sendMail({
            from: `"FPA Alert System" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "🚨 Flood Risk Warning",
            text: `Dear ${type},\n\n${personalizedMsgEN}\n\nStay safe,\nFPA System`,
          });
          emailSentCount++;
          console.log(`✅ Email sent successfully to ${email}`);
        } catch (emailErr) {
          console.error(`❌ Failed to send Email to ${email}:`, emailErr.message || emailErr);
        }
      } else {
        console.log(`ℹ️ No email for ${full_name}`);
      }
    }

    console.log(`✅ Alerts sent summary: ${smsSentCount} SMS, ${emailSentCount} Email(s)`);
    return res.status(200).json({
      message: `✅ Alerts sent successfully! SMS: ${smsSentCount}, Emails: ${emailSentCount}`,
    });
  } catch (err) {
    console.error("🚨 General alert sending error:", err);
    return res.status(500).json({ error: "Failed to send alerts." });
  }
});

module.exports = router;
