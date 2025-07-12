import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../CSS/Form.css';

export default function Login({ switchToRegister, onCancel }) {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(''); // separate server error state
  const navigate = useNavigate();

  const refs = { identifier: useRef(null), password: useRef(null) };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setServerError(''); // Clear server error on typing
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.identifier.trim()) newErrors.identifier = '⚠️ Please provide your email, username, or phone';
    if (!formData.password.trim()) newErrors.password = '⚠️ Please enter your password';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      if (newErrors.identifier) refs.identifier.current?.focus();
      else if (newErrors.password) refs.password.current?.focus();
      return;
    }

    try {
      setLoading(true);
      setServerError('');
      const res = await axios.post('http://localhost:5000/api/userLoginRoutes/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/flooddata');
    } catch (err) {
      setServerError('❌ Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="form-title">Login</h2>
      <form onSubmit={handleLogin} className="form-container" noValidate>
        <input
          name="identifier"
          ref={refs.identifier}
          type="text"
          placeholder="Email / Username / Phone"
          value={formData.identifier}
          onChange={handleChange}
          className="form-input"
          aria-describedby="error-identifier"
          aria-invalid={!!errors.identifier}
          autoComplete="username"
          disabled={loading}
        />
        {errors.identifier && <div id="error-identifier" className="erroor" aria-live="polite">{errors.identifier}</div>}

        <input
          name="password"
          ref={refs.password}
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="form-input"
          aria-describedby="error-password"
          aria-invalid={!!errors.password}
          autoComplete="current-password"
          disabled={loading}
        />
        {errors.password && <div id="error-password" className="erroor" aria-live="polite">{errors.password}</div>}

        {serverError && <div className="erroor" aria-live="polite">{serverError}</div>}

        <div className="login-buttons-container">
          <button type="submit" className="login-button" disabled={loading || !!serverError}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {onCancel && (
            <button type="button" className="cancel-button-login" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>

        <div className="form-switch-text-register">
          Don't have an account?{' '}
          <button type="button" className="form-link-register" onClick={switchToRegister} disabled={loading}>
            Register here
          </button>
        </div>
      </form>
    </div>
  );
}
