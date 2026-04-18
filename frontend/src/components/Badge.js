import React from 'react';
import './Badge.css';

const Badge = ({ status, children }) => {
  return (
    <span className={`badge ${status}`}>
      {children}
    </span>
  );
};

export default Badge;