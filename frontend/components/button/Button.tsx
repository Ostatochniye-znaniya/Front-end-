"use client";

import React from 'react';

interface ButtonProps {
  title: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ title, color, onClick, disabled }) => {
  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn ${color}`}
    >
      {title}
    </button>
  );
}

export default Button;