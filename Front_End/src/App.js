import React from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import AppLayout from './Components/AppLayout';
import Login from './Components/Auth/Login'; 
import Logout from './Components/Auth/Logout'; 
import Register from './Components/Auth/Register'; 
import ForgotPassword from './Components/Auth/ForgotPassword';
import ResetPasswordModal from './Components/Auth/ResetPasswordModal';


import HomePage from './Components/Home/HomePage'; 
import Profile from './Components/Home/Profile'; 





import FloodData from './Components/FloodData'; 
import FloodStatus from './Components/FloodStatus'; 
import PrivateRoute from './Components/Home/PrivateRoute'; 








function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPasswordModal />} />
        <Route path="/logout" element={<Logout />} />


        <Route path="/flooddata" element={<PrivateRoute><AppLayout><FloodData /></AppLayout></PrivateRoute>} />
        <Route path="/floodstatus" element={<PrivateRoute><AppLayout><FloodStatus /></AppLayout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
