import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Register from '../Auth/Register';
import Login from '../Auth/Login';
import ForgotPassword from '../Auth/ForgotPassword';
import '../CSS/HomePage.css';
import '../CSS/Form.css';

const bgImages = [
  '/images/ikiraro-7.jpg',
  '/images/img_20201007_144400-625bd.jpg',
  '/images/map.png',
  '/images/map2.png'
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex =>
        prevIndex === bgImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const openModal = contentType => {
    setModalContent(contentType);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchModalContent = contentType => {
    setModalContent(contentType);
  };

  return (
    <div className="home-container">
      <div className="bg-slider">
        {bgImages.map((img, index) => (
          <div
            key={index}
            className={`bg-slide ${index === currentImageIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="bg-overlay"></div>
      </div>

      <div className="hero-content">
        <div className="content-card">
          <h5 className="hero-subtitle">Flood Prediction & Alert System</h5>
          <h1 className="hero-title">Welcome to FPA Dashboard</h1>
          <p className="hero-description">
            Stay informed and prepared with real-time flood data, alerts, and community reports.
          </p>

          <div className="home-actions">
            <div className="auth-buttons">
              <button className="btn-auth login-btn" onClick={() => openModal('login')}>
                Login
              </button>
              <button className="btn-auth register-btn" onClick={() => openModal('register')}>
                Register
              </button>
            </div>

            <div className="forgot-password-link">
              <p>
                Forgot password?{' '}
                <button
                  className="link-reset-password"
                  onClick={() => openModal('forgot-password')}
                >
                  Reset it here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} closeModal={closeModal}>
        {modalContent === 'login' && (
          <Login switchToRegister={() => switchModalContent('register')} onCancel={closeModal} />
        )}
        {modalContent === 'register' && (
          <Register switchToLogin={() => switchModalContent('login')} onCancel={closeModal} />
        )}
        {modalContent === 'forgot-password' && <ForgotPassword onCancel={closeModal} />}
      </Modal>
    </div>
  );
}
