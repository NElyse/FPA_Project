import React, { useState, useEffect } from 'react';
import '../CSS/Form.css';

export default function ResetPasswordPage({ token, isOpen, onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validToken, setValidToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !isOpen) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/userLoginRoutes/reset-password/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setValidToken(false);
        } else {
          setValidToken(true);
          setError('');
        }
      })
      .catch(() => setError('Server error validating token.'))
      .finally(() => setLoading(false));
  }, [token, isOpen]);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Both password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/userLoginRoutes/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Password reset successful. Redirecting to login...');
        setError('');
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setError(data.error || 'Password reset failed.');
        setMessage('');
      }
    } catch {
      setError('Network error. Try again later.');
      setMessage('');
    }
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay-reset-password"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
    >
      <div
        className="modal-content-reset-password"
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <p className="loading-text-reset-password">Validating token...</p>
        ) : !validToken ? (
          <>
            <p className="erroor-reset-password">{error || 'Invalid or expired token.'}</p>
            <button
              className="cancel-button-reset-password"
              onClick={onClose}
              disabled={submitting}
            >
              Close
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="form-container-reset-password" noValidate>
            <h2 id="reset-password-title" className="form-title-reset-password">
              Set New Password
            </h2>

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="form-input-reset-password"
              autoFocus
              disabled={submitting}
              aria-required="true"
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="form-input-reset-password"
              disabled={submitting}
              aria-required="true"
            />

            <div className="reset-password-buttons-container">
              <button type="submit" className="reset-password-button" disabled={submitting}>
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                className="cancel-button-reset-password"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>

            {message && <p className="successs-reset-password">{message}</p>}
            {error && <p className="erroor-reset-password">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
