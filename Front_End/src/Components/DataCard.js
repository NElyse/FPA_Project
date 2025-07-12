// src/components/DataCard.js
import React from 'react';

const DataCard = ({ title, value, unit, color }) => {
  return (
    <div className={`rounded-2xl shadow-lg p-4 text-white ${color}`}>
      <h2 className="text-md font-medium">{title}</h2>
      <p className="text-3xl font-bold">
        {value} <span className="text-lg">{unit}</span>
      </p>
    </div>
  );
};

export default DataCard;