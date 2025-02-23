// src/components/Alert/Alert.jsx
import React from 'react';

export default function Alert({ type = "info", message, onClose }) {
  const types = {
    success: "bg-green-100 text-green-700 border-green-500",
    error: "bg-red-100 text-red-700 border-red-500",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-500",
    info: "bg-blue-100 text-blue-700 border-blue-500"
  };

  return (
    <div className={`${types[type]} border-l-4 p-4 mb-4 rounded`}>
      <div className="flex justify-between items-center">
        <div>{message}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
