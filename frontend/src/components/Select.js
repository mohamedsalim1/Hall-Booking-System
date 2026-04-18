import React from 'react';
import './Select.css';

const Select = ({ options, value, onChange, placeholder, className = '', ...props }) => {
  return (
    <select
      className={`select ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;