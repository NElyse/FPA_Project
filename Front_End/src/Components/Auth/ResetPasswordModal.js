import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';

export default function ResetPasswordModal() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    navigate('/login'); // redirect after reset
  };

  return <ResetPasswordPage token={token} isOpen={isOpen} onClose={handleClose} />;
}
