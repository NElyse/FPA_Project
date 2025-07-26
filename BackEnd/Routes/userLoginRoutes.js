require('dotenv').config();
const express = require('express');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const db = require('../config/db');

function formatDateToSQL(date) {
  return date.format('YYYY-MM-DD HH:mm:ss');
}

// REGISTER
router.post('/register', async (req, res) => {
  const { fullNames, email, username, phone, password, role } = req.body;

  try {
    const request = await db.request();
    const result = await request
      .input('email', db.sql.VarChar, email)
      .input('username', db.sql.VarChar, username)
      .input('phone', db.sql.VarChar, phone)
      .query(`
        SELECT * FROM users 
        WHERE email = @email OR username = @username OR phone = @phone
      `);
    const existing = result.recordset;

    if (existing.length) {
      if (existing.some(u => u.email === email)) return res.status(400).json({ error: 'Email already exists.' });
      if (existing.some(u => u.username === username)) return res.status(400).json({ error: 'Username already taken.' });
      if (existing.some(u => u.phone === phone)) return res.status(400).json({ error: 'Phone already registered.' });
    }

    // Store password as plain text (not recommended)
    const insertRequest = await db.request();
    await insertRequest
      .input('full_names', db.sql.NVarChar, fullNames)
      .input('email', db.sql.VarChar, email)
      .input('username', db.sql.VarChar, username)
      .input('phone', db.sql.VarChar, phone)
      .input('password_hash', db.sql.VarChar, password) // <-- plaintext password
      .input('role', db.sql.VarChar, role || 'user')
      .query(`
        INSERT INTO users (full_names, email, username, phone, password_hash, role)
        VALUES (@full_names, @email, @username, @phone, @password_hash, @role)
      `);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password are required' });
  }

  try {
    const request = await db.request();
    const result = await request
      .input('identifier', db.sql.VarChar, identifier)
      .query(`
        SELECT TOP 1 id, full_names, email, username, phone, password_hash, role
        FROM users
        WHERE username = @identifier OR email = @identifier OR phone = @identifier
      `);

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Plaintext password comparison
    if (password !== user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// FORGOT PASSWORDcreateTransport

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const request = await db.request();
    const result = await request
      .input('email', db.sql.VarChar, email)
      .query('SELECT TOP 1 id, full_names FROM users WHERE email = @email');

    const user = result.recordset[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const now = moment().tz('Africa/Kigali');
    const createdAt = formatDateToSQL(now);
    const expiresAt = formatDateToSQL(now.clone().add(1, 'hour'));

    const insertReset = await db.request();
    await insertReset
      .input('user_id', db.sql.Int, user.id)
      .input('token', db.sql.VarChar, token)
      .input('created_at', db.sql.DateTime, createdAt)
      .input('expires_at', db.sql.DateTime, expiresAt)
      .query(`
        INSERT INTO password_resets (user_id, token, created_at, expires_at)
        VALUES (@user_id, @token, @created_at, @expires_at)
      `);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
   const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    

    const mailOptions = {
      from: `"Flood Alert App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Instructions',
      html: `
        <p>Hi ${user.full_names},</p>
        <p>You requested a password reset. Click below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Please check your email for the reset token.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const request = await db.request();
    const result = await request
      .input('token', db.sql.VarChar, token)
      .query(`
        SELECT TOP 1 user_id, expires_at 
        FROM password_resets 
        WHERE token = @token 
        ORDER BY created_at DESC
      `);

    const row = result.recordset[0];
    if (!row || new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ userId: row.user_id });
  } catch (err) {
    console.error('Validate token error:', err);
    res.status(500).json({ error: 'Server error validating token' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'New password is required' });

  try {
    const request = await db.request();
    const result = await request
      .input('token', db.sql.VarChar, token)
      .query(`
        SELECT TOP 1 user_id, expires_at 
        FROM password_resets 
        WHERE token = @token 
        ORDER BY created_at DESC
      `);

    const row = result.recordset[0];
    if (!row || new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Directly update with new password as plain text
    const updateRequest = await db.request();
    await updateRequest
      .input('password_hash', db.sql.VarChar, newPassword) // plaintext password
      .input('user_id', db.sql.Int, row.user_id)
      .query(`
        UPDATE users SET password_hash = @password_hash WHERE id = @user_id
      `);

    // Delete token after use
    const deleteRequest = await db.request();
    await deleteRequest
      .input('token', db.sql.VarChar, token)
      .query(`DELETE FROM password_resets WHERE token = @token`);

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { full_names, email, username, phone } = req.body;

  try {
    // Check duplicates
    const checkDup = await db.request();
    const dupResult = await checkDup
      .input('email', db.sql.VarChar, email)
      .input('username', db.sql.VarChar, username)
      .input('phone', db.sql.VarChar, phone)
      .input('id', db.sql.Int, userId)
      .query(`
        SELECT id FROM users 
        WHERE (email = @email OR username = @username OR phone = @phone)
        AND id != @id
      `);
    
    if (dupResult.recordset.length > 0) {
      return res.status(400).json({ error: 'Email, username, or phone already in use by another user.' });
    }

    // Dynamically build update query
    const fields = [];
    const inputs = [];

    if (full_names) {
      fields.push('full_names = @full_names');
      inputs.push({ name: 'full_names', type: db.sql.NVarChar, value: full_names });
    }
    if (email) {
      fields.push('email = @email');
      inputs.push({ name: 'email', type: db.sql.VarChar, value: email });
    }
    if (username) {
      fields.push('username = @username');
      inputs.push({ name: 'username', type: db.sql.VarChar, value: username });
    }
    if (phone) {
      fields.push('phone = @phone');
      inputs.push({ name: 'phone', type: db.sql.VarChar, value: phone });
    }

    fields.push('updated_at = GETDATE()');
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    const updateRequest = await db.request();
    inputs.forEach(input => {
      updateRequest.input(input.name, input.type, input.value);
    });
    updateRequest.input('id', db.sql.Int, userId);

    const updateSql = `UPDATE users SET ${fields.join(', ')} WHERE id = @id`;
    const result = await updateRequest.query(updateSql);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return updated user
    const fetch = await db.request();
    const updatedUser = await fetch
      .input('id', db.sql.Int, userId)
      .query(`
        SELECT id, full_names, email, username, phone, role FROM users WHERE id = @id
      `);

    res.json({ user: updatedUser.recordset[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
