
// src/components/Button/Button.jsx
import React from 'react';

export default function Button({ children, onClick, variant = "primary", type = "button", disabled = false }) {
  const baseStyles = "px-4 py-2 rounded font-medium focus:outline-none focus:ring-2";
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}