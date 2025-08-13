import React from "react";

const DataCard = ({ title, value, color }) => {
  return (
    <div
      className={`rounded-md p-2 text-white text-sm font-medium ${color} flex items-center justify-between`}
    >
      <span>{title}:</span>
      <span>{value}</span>
    </div>
  );
};

export default DataCard;
