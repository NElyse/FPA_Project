require('dotenv').config();
const express = require('express');
const moment = require('moment-timezone');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const db = require('../config/db');

// Helper to format dates for MySQL
function formatDateToMySQL(date) {
  return date.format('YYYY-MM-DD HH:mm:ss');
}

// REGISTER
router.post('/register', async (req, res) => {
  const { fullNames, email, username, phone, password, role } = req.body;
  try {
    const checkSql = 'SELECT * FROM users WHERE email = ? OR username = ? OR phone = ?';
    const [existing] = await db.execute(checkSql, [email, username, phone]);
    if (existing.length) {
      if (existing.some(u => u.email === email))   return res.status(400).json({ error: 'Email already exists.' });
      if (existing.some(u => u.username === username)) return res.status(400).json({ error: 'Username already taken.' });
      if (existing.some(u => u.phone === phone))   return res.status(400).json({ error: 'Phone already registered.' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.execute(
      `INSERT INTO users (full_names,email,username,phone,password_hash,role)
       VALUES (?,?,?,?,?,?)`,
      [fullNames, email, username, phone, hash, role||'user']
    );
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
    const sql = `
      SELECT id, full_names, email, username, phone, password_hash, role
      FROM users
      WHERE username = ? OR email = ? OR phone = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(sql, [identifier, identifier, identifier]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { id: user.id, username: user.username, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET||'secret', { expiresIn: '1h' });
    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// FORGOT PASSWORD — send reset link to React client on port 3000
// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const [users] = await db.execute('SELECT id, full_names FROM users WHERE email = ? LIMIT 1', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');

    const now = moment().tz('Africa/Kigali');
    const createdAtFormatted = formatDateToMySQL(now);
    const expiresAtFormatted = formatDateToMySQL(now.clone().add(1, 'hour'));

    await db.execute(
      'INSERT INTO password_resets (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, token, createdAtFormatted, expiresAtFormatted]
    );

    // Use CLIENT_URL dynamically from environment
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465', // true for port 465, false for others
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


// VALIDATE TOKEN
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  try {
    console.log('Validating:', token);
    const [rows] = await db.execute(
      'SELECT user_id, expires_at FROM password_resets WHERE token = ? ORDER BY created_at DESC LIMIT 1',
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired token' });

    const expiresAt = new Date(rows[0].expires_at);
    const now = new Date();

    console.log('Expires:', expiresAt, 'Now:', now);
    if (expiresAt < now) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ userId: rows[0].user_id });
  } catch (err) {
    console.error('Validate token error:', err);
    res.status(500).json({ error: 'Server error validating token' });
  }
});

// RESET PASSWORD
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ error: 'New password is required' });

  try {
    const [rows] = await db.execute(
      'SELECT user_id, expires_at FROM password_resets WHERE token = ? ORDER BY created_at DESC LIMIT 1',
      [token]
    );

    if (rows.length === 0 || new Date(rows[0].expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const userId = rows[0].user_id;

    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
    await db.execute('DELETE FROM password_resets WHERE token = ?', [token]);

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update User
router.put('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { full_names, email, username, phone } = req.body;

  try {
    const fields = [];
    const values = [];

    if (full_names) { fields.push('full_names = ?'); values.push(full_names); }
    if (email) { fields.push('email = ?'); values.push(email); }
    if (username) { fields.push('username = ?'); values.push(username); }
    if (phone) { fields.push('phone = ?'); values.push(phone); }

    fields.push('updated_at = NOW()');

    if (fields.length === 0) return res.status(400).json({ error: 'No fields provided to update' });

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(userId);

    const [result] = await db.execute(sql, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });

    const [updatedUsers] = await db.execute('SELECT id, full_names, email, username, phone, role FROM users WHERE id = ?', [userId]);
    if (updatedUsers.length === 0) return res.status(500).json({ error: 'Failed to fetch updated user' });

    res.json({ user: updatedUsers[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
