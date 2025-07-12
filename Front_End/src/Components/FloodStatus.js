// src/components/FloodStatus.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FloodStatus = () => {
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/floodDataRoutes/selectFloodStatus')
      .then(res => {
        setStatusData(res.data);
      })
      .catch(err => {
        console.error('Error fetching flood status:', err);
      });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Flood Status Overview</h2>
      {statusData.length === 0 ? (
        <p>No flood status data available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statusData.map((status) => (
            <div key={status.id} className="bg-white p-4 rounded shadow">
              <p><strong>Location:</strong> {status.location}</p>
              <p><strong>Risk Level:</strong> {status.risk_level}</p>
              <p><strong>Time:</strong> {new Date(status.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FloodStatus;
