import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../CSS/Register.css';

export default function Register({ onCancel, switchToLogin }) {
  const [form, setForm] = useState({
    fullNames: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    role: 'user'
  });

  const [errorsRegister, setErrorsRegister] = useState({});
  const [successsRegister, setSuccesssRegister] = useState('');

  useEffect(() => {
    if (Object.keys(errorsRegister).length > 0 || successsRegister) {
      const timer = setTimeout(() => {
        setErrorsRegister({});
        setSuccesssRegister('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorsRegister, successsRegister]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorsRegister({ ...errorsRegister, [e.target.name]: '' });
    setSuccesssRegister('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullNames.trim()) newErrors.fullNames = '⚠️ Please! provide your full names.';
    if (!form.email.trim()) newErrors.email = '⚠️ Please! provide your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = '❌ Please! enter a valid email.';
    if (!form.username.trim()) newErrors.username = '⚠️ Please! Choose a username.';
    if (!form.phone.trim()) newErrors.phone = '⚠️ Please provide your phone number.';
    else if (!/^(078|079|072|073)\d{7}$/.test(form.phone))
      newErrors.phone = '❌ Valid phone must start with 078, 079, 072, or 073 and be 10 digits.';
    if (!form.password) newErrors.password = '⚠️ Please! create a password.';
    return newErrors;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('[DEBUG] Submit started with form:', form);
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      console.log('[DEBUG] Validation failed:', validationErrors);
      setErrorsRegister(validationErrors);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/userLoginRoutes/register', form, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('[DEBUG] Server response:', response.data);
      setSuccesssRegister('✅ ' + response.data.message);
      setForm({
        fullNames: '',
        email: '',
        username: '',
        phone: '',
        password: '',
        role: 'user'
      });
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Try again.';
      console.error('[DEBUG] Registration error:', msg);

      if (msg.includes('email')) setErrorsRegister({ email: msg });
      else if (msg.includes('username')) setErrorsRegister({ username: msg });
      else if (msg.includes('phone')) setErrorsRegister({ phone: msg });
      else setErrorsRegister({ general: msg });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container" noValidate>
      <label className="form-label">Full Names</label>
      <input name="fullNames" className="form-input" value={form.fullNames} onChange={handleChange} />
      {errorsRegister.fullNames && <div className="erroor-register">{errorsRegister.fullNames}</div>}

      <label className="form-label">Email</label>
      <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} />
      {errorsRegister.email && <div className="erroor-register">{errorsRegister.email}</div>}

      <label className="form-label">Username</label>
      <input name="username" className="form-input" value={form.username} onChange={handleChange} />
      {errorsRegister.username && <div className="erroor-register">{errorsRegister.username}</div>}

      <label className="form-label">Phone</label>
      <input name="phone" className="form-input" value={form.phone} onChange={handleChange} />
      {errorsRegister.phone && <div className="erroor-register">{errorsRegister.phone}</div>}

      <label className="form-label">Password</label>
      <input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} />
      {errorsRegister.password && <div className="erroor-register">{errorsRegister.password}</div>}

      <label className="form-label">Role</label>
      <select name="role" className="form-select" value={form.role} onChange={handleChange}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>

      <div className="register-buttons-container">
        <button type="submit" className="register-button">Register</button>
        {onCancel && (
          <button type="button" className="cancel-button-register" onClick={onCancel}>Cancel</button>
        )}
      </div>

      {errorsRegister.general && <div className="erroor-register">{errorsRegister.general}</div>}
      {successsRegister && <div className="successs-register">{successsRegister}</div>}

      <div className="form-switch-text-register">
        Already have an account?{' '}
        <button type="button" className="form-link-register" onClick={switchToLogin}>Click to Login</button>
      </div>
    </form>
  );
}
