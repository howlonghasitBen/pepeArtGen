import React, { useState, useRef } from 'react';
import './PartEditor.css';

function PartEditor({ part, partSchema, card, onUpdateField, onUpdateFields }) {
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  if (!partSchema) {
    return <div className="part-editor-empty">Select a part to edit</div>;
  }

  const getFieldValue = (fieldKey) => {
    // Handle nested paths
    if (fieldKey.includes('.')) {
      const parts = fieldKey.split('.');
      let value = card;
      for (const p of parts) {
        value = value?.[p];
      }
      return value;
    }

    // Check if it's a stats field
    if (partSchema.fields[fieldKey] && part === 'stats') {
      return card.stats?.[fieldKey];
    }

    return card[fieldKey];
  };

  const handleFieldChange = (fieldKey, value) => {
    // Route to correct path
    if (part === 'stats') {
      onUpdateField(`stats.${fieldKey}`, value);
    } else {
      onUpdateField(fieldKey, value);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      setImagePreview(imageData);
      onUpdateField('imageData', imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleRandomize = (fieldKey, fieldSchema) => {
    let value;

    if (fieldSchema.type === 'number') {
      const min = fieldSchema.min || 1;
      const max = fieldSchema.max || 10;
      value = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (fieldSchema.type === 'select') {
      const options = fieldSchema.options;
      value = options[Math.floor(Math.random() * options.length)];
    }

    if (value !== undefined) {
      handleFieldChange(fieldKey, value);
    }
  };

  const renderField = (fieldKey, fieldSchema) => {
    const value = getFieldValue(fieldKey);
    const id = `field-${part}-${fieldKey}`;

    switch (fieldSchema.type) {
      case 'string':
        return (
          <div key={fieldKey} className="field-group">
            <label htmlFor={id} className="field-label">
              {fieldSchema.label}
              {fieldSchema.optional && <span className="optional-tag">Optional</span>}
            </label>
            <input
              id={id}
              type="text"
              className="field-input"
              value={value || ''}
              placeholder={fieldSchema.placeholder}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            />
          </div>
        );

      case 'number':
        return (
          <div key={fieldKey} className="field-group">
            <label htmlFor={id} className="field-label">
              {fieldSchema.label}
              <span className="field-value-display">{value || fieldSchema.min || 0}</span>
            </label>
            <div className="slider-container">
              <input
                id={id}
                type="range"
                className="field-slider"
                min={fieldSchema.min || 0}
                max={fieldSchema.max || 10}
                value={value || fieldSchema.min || 0}
                onChange={(e) => handleFieldChange(fieldKey, parseInt(e.target.value))}
              />
              <button
                className="randomize-btn"
                onClick={() => handleRandomize(fieldKey, fieldSchema)}
                title="Randomize"
              >
                🎲
              </button>
            </div>
            <div className="slider-labels">
              <span>{fieldSchema.min || 0}</span>
              <span>{fieldSchema.max || 10}</span>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldKey} className="field-group">
            <label htmlFor={id} className="field-label">
              {fieldSchema.label}
              {fieldSchema.optional && <span className="optional-tag">Optional</span>}
            </label>
            <textarea
              id={id}
              className="field-textarea"
              rows={fieldSchema.rows || 3}
              value={value || ''}
              placeholder={fieldSchema.placeholder}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            />
          </div>
        );

      case 'select':
        return (
          <div key={fieldKey} className="field-group">
            <label htmlFor={id} className="field-label">
              {fieldSchema.label}
            </label>
            <div className="select-container">
              <select
                id={id}
                className="field-select"
                value={value || fieldSchema.options[0]}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              >
                {fieldSchema.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <button
                className="randomize-btn"
                onClick={() => handleRandomize(fieldKey, fieldSchema)}
                title="Randomize"
              >
                🎲
              </button>
            </div>
          </div>
        );

      case 'image':
        return (
          <div key={fieldKey} className="field-group">
            <label className="field-label">{fieldSchema.label}</label>
            <div className="image-upload-area">
              {(imagePreview || card.imageData) ? (
                <div className="image-preview-container">
                  <img
                    src={imagePreview || card.imageData}
                    alt="Card"
                    className="image-preview"
                  />
                  <button
                    className="image-change-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div
                  className="image-drop-zone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="drop-zone-content">
                    <span className="drop-icon">🖼️</span>
                    <span>Click to upload image</span>
                    <span className="drop-hint">PNG, JPG up to 5MB</span>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        );

      case 'palette':
        return (
          <div key={fieldKey} className="field-group">
            <label className="field-label">{fieldSchema.label}</label>
            <div className="color-palette">
              {card.colors ? (
                Object.entries(card.colors).map(([colorName, colorValue]) => (
                  <div key={colorName} className="palette-color">
                    <div
                      className="color-swatch"
                      style={{ backgroundColor: colorValue }}
                      title={colorName}
                    />
                    <span className="color-name">{colorName}</span>
                  </div>
                ))
              ) : (
                <div className="palette-empty">
                  Upload an image to extract colors
                </div>
              )}
            </div>
            {card.imageData && !card.colors && (
              <button
                className="extract-colors-btn"
                onClick={() => {
                  // TODO: Call color extraction API
                  console.log('Extract colors from image');
                }}
              >
                🎨 Extract Colors
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="part-editor">
      <div className="part-editor-header">
        <span className="part-editor-icon">{partSchema.icon}</span>
        <h3 className="part-editor-title">{partSchema.label}</h3>
      </div>

      <div className="part-editor-fields">
        {Object.entries(partSchema.fields).map(([key, schema]) =>
          renderField(key, schema)
        )}
      </div>

      <div className="part-editor-actions">
        {part === 'stats' && (
          <button
            className="preset-btn"
            onClick={() => {
              // Randomize all stats
              onUpdateFields({
                'stats.hp': Math.floor(Math.random() * 15) + 5,
                'stats.attack': Math.floor(Math.random() * 12) + 3,
                'stats.defense': Math.floor(Math.random() * 12) + 3,
                'stats.mana': Math.floor(Math.random() * 8) + 2,
                'stats.speed': Math.floor(Math.random() * 8) + 2
              });
            }}
          >
            🎲 Randomize All Stats
          </button>
        )}
      </div>
    </div>
  );
}

export default PartEditor;
