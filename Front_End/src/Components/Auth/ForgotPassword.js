import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../CSS/Form.css';

export default function ForgotPassword({ onCancel }) {
  const [email, setEmail] = useState('');
  const [msgForgot, setMsgForgot] = useState('');
  const [errEmpty, setErrEmpty] = useState('');
  const [errInvalid, setErrInvalid] = useState('');
  const [errGeneral, setErrGeneral] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset messages
    setMsgForgot('');
    setErrGeneral('');
    setErrEmpty('');
    setErrInvalid('');
    setLoading(true);

    if (!email.trim()) {
      setErrEmpty('⚠️ Please provide your email');
      setLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setErrInvalid('❌ Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/userLoginRoutes/forgot-password', { email });
      setMsgForgot('✅ ' + res.data.message);
    } catch (err) {
      setErrGeneral('❌ ' + (err.response?.data?.error || 'Error sending reset email'));
    } finally {
      setLoading(false);
    }
  };

  // Auto-hide all messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setErrEmpty('');
      setErrInvalid('');
      setErrGeneral('');
    }, 5000);

    return () => clearTimeout(timer); // Clean up
  }, [errEmpty, errInvalid, errGeneral]);

  return (
    <form onSubmit={handleSubmit} className="form-container" noValidate>
      {msgForgot && <div className="successs-forgot-password ">{msgForgot}</div>}
      <label className="form-label">Email</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="form-input"
        placeholder="Enter your email"
      />

      {errEmpty && <div className="erroor-forgot-password fade-message">{errEmpty}</div>}
      {errInvalid && <div className="erroor-forgot-password fade-message">{errInvalid}</div>}
      {errGeneral && <div className="erroor-forgot-password fade-message">{errGeneral}</div>}

      <div className="rest-buttons-container">
        <button
          type="submit"
          className="rest-button-forgot"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Reset Password'}
        </button>

        {onCancel && (
          <button
            type="button"
            className="cancel-button-forgot"
            onClick={onCancel}
          >
            Back to Login
          </button>
        )}
      </div>

      
    </form>
  );
}
