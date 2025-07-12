// src/Components/Profile/Modal.js
import React from 'react';
import '../CSS/Modal.css';

export default function Modal({ isOpen, closeModal, children }) {
  if (!isOpen) return null;

  // Prevent closing modal when clicking inside modal content
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div
      className="modal-overlay"
      onClick={closeModal}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="modal-container" onClick={stopPropagation}>
        <button
          className="modal-close-btn"
          onClick={closeModal}
          aria-label="Close modal"
          type="button"
        >
          &times;
        </button>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
