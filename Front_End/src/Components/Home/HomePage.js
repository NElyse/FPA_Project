import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import Register from "../Auth/Register";
import ForgotPassword from "../Auth/ForgotPassword";
import Login from "../Auth/Login";

import "../CSS/HomePage.css";
import "../CSS/Form.css";

export function ScrollToHash() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const el = document.querySelector(location.hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);
  return null;
}

const bgImages = [
  "/images/ikiraro-7.jpg",
  "/images/img_20201007_144400-625bd.jpg",
  "/images/map.png",
  "/images/map2.png",
];

const featureCards = [
  { title: "Real-Time Flood Data", desc: "Access up-to-the-minute flood measurements from sensors and satellites.", emoji: "🌊" },
  { title: "Early Warning Alerts", desc: "Receive instant notifications via SMS, email, or app when flood risk is high.", emoji: "🚨" },
  { title: "Community Reporting", desc: "Enable local users to report flood events, improving situational awareness.", emoji: "📢" },
  { title: "Risk Analysis & Prediction", desc: "Advanced algorithms forecast flood risks based on environmental data.", emoji: "📈" },
  { title: "Interactive Maps", desc: "Visualize flood-prone areas and safe zones with dynamic, layered maps.", emoji: "🗘️" },
  { title: "Historical Data Insights", desc: "Analyze past flood events to plan and improve future disaster management.", emoji: "📚" },
];

const additionalModules = [
  "Mobile Alerts Integration",
  "Multi-language Support",
  "Government & NGO API Access",
];

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === bgImages.length - 1 ? 0 : prev + 1));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (type) => {
    setModalContent(type);
    setIsModalOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent("");
  };

  const switchModalContent = (type) => {
    setModalContent(type);
  };

  return (
    <div className="home-container">
      <ScrollToHash />

      {/* HEADER */}
      <header className="header">
        <div className="header-wrapper">
          <h1 className="logo"><a href="#welcome">FPA</a></h1>

          <nav className={`nav-links ${showMenu ? "show" : ""}`} aria-label="Main Navigation">
            <a href="#welcome" onClick={() => setShowMenu(false)}>Home</a>
            <a href="#about" onClick={() => setShowMenu(false)}>About</a>
            <a href="#features" onClick={() => setShowMenu(false)}>Features</a>
            <a href="#modules" onClick={() => setShowMenu(false)}>Additional</a>
          </nav>

          <div className="burger" onClick={() => setShowMenu(!showMenu)} aria-label="Menu Toggle">
            <div></div><div></div><div></div>
          </div>
        </div>
      </header>

      {/* HERO + BACKGROUND SLIDER */}
      <main className="main-content" role="main" id="welcome">
        <section className="hero-section">
          <div className="bg-slider">
            {bgImages.map((img, index) => (
              <div
                key={index}
                className={`bg-slide ${index === currentImageIndex ? "active" : ""}`}
                style={{ backgroundImage: `url(${img})` }}
              />
            ))}
            <div className="bg-overlay"></div>
          </div>

          <div className="content-card">
            <h5 className="hero-subtitle">Flood Prediction & Alert System</h5>
            <h1 className="hero-title">Welcome to FPA Dashboard</h1>
            <p className="hero-description">
              Stay informed and prepared with real-time flood data, alerts, and community reports.
            </p>

            <div className="home-actions">
              <div className="auth-buttons">
                <button className="btn-auth login-btn" onClick={() => openModal("login")}>Login</button>
                <button className="btn-auth register-btn" onClick={() => openModal("register")}>Register</button>
              </div>

              <div className="forgot-password-link">
                <p>
                  Forgot password?{' '}
                  <button className="link-reset-password" onClick={() => openModal("forgot-password")}>Reset it here</button>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section about-section">
          <h3>About the FPA Project</h3>
          <p>
            The Flood Prediction & Alert System (FPA) leverages advanced environmental monitoring, data analysis, and community reporting to deliver timely flood risk assessments.<br /><br />
            FPA empowers governments, organizations, and communities with actionable flood warnings to protect lives and property.<br /><br />
            By integrating real-time sensor data, weather forecasts, and machine learning models, FPA increases flood preparedness and resilience.
          </p>
        </section>

        <section id="features" className="section features-section">
          <h3>System Features</h3>
          <motion.div
            className="cards-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            {featureCards.map((card) => (
              <motion.div
                key={card.title}
                className="card-item"
                variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <h2><span>{card.emoji}</span> {card.title}</h2>
                <p>{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section id="modules" className="section additional-modules-section">
          <h3>Additional Modules</h3>
          <div className="features-grid">
            {additionalModules.map((mod) => (
              <div className="feature-card" key={mod}>
                <h4>{mod}</h4>
                <p>{mod} enhances FPA's flexibility, real-time alerting, and integration capabilities.</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Flood Prediction & Alert System (FPA). All rights reserved. Developed by ElSol.
      </footer>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modalContent === "login" && (
              <Login switchToRegister={() => switchModalContent("register")} onCancel={closeModal} />
            )}
            {modalContent === "register" && <Register switchToLogin={() => switchModalContent("login")} onCancel={closeModal} />}
            {modalContent === "forgot-password" && <ForgotPassword onCancel={closeModal} />}
          </div>
        </div>
      )}
    </div>
  );
}
