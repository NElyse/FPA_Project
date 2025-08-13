// src/components/FloodStatus.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../CSS/FloodData.css'; // Optional for custom styles

const FloodStatus = () => {
  const [statusData, setStatusData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/floodDataRoutes/selectFloodStatus')
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          setStatusData(data);
        } else {
          setError('Invalid response from server.');
        }
      })
      .catch(err => {
        console.error('Error fetching flood status:', err);
        setError('Failed to fetch flood status.');
      });
  }, []);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low':
        return 'bg-green-100 border-green-500 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Flood Status Overview</h2>

      {error && <p className="text-red-600 text-center">{error}</p>}

      {statusData.length === 0 && !error ? (
        <p className="text-center text-gray-500">No flood status data available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusData.map((status) => (
            <div
              key={status.id}
              className={`border-l-4 p-4 rounded shadow ${getRiskColor(status.risk_level)}`}
            >
              <p><strong>🌍 Location:</strong> {status.location}</p>
              <p><strong>⚠️ Risk Level:</strong> {status.risk_level}</p>
              <p><strong>🕒 Time:</strong> {new Date(status.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FloodStatus;
