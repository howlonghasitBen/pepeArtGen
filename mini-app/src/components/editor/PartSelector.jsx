import React from 'react';
import './PartSelector.css';

function PartSelector({ parts, selectedPart, onSelectPart }) {
  const partEntries = Object.entries(parts);

  return (
    <div className="part-selector">
      <div className="part-selector-header">
        <h3>Card Parts</h3>
      </div>

      <div className="part-list">
        {partEntries.map(([key, part]) => (
          <button
            key={key}
            className={`part-item ${selectedPart === key ? 'active' : ''}`}
            onClick={() => onSelectPart(key)}
          >
            <span className="part-icon">{part.icon}</span>
            <span className="part-label">{part.label}</span>
            <span className="part-arrow">&gt;</span>
          </button>
        ))}
      </div>

      <div className="part-selector-footer">
        <div className="part-tip">
          Click a part to edit its properties
        </div>
      </div>
    </div>
  );
}

export default PartSelector;
