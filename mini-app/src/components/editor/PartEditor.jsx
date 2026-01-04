import React, { useState, useRef, useCallback } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useGenerationPayment } from '../../hooks/useGenerationPayment';
import './PartEditor.css';

function PartEditor({ part, partSchema, card, onUpdateField, onUpdateFields }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const fileInputRef = useRef(null);

  // Art generation state
  const [artPrompt, setArtPrompt] = useState('');
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [artGenError, setArtGenError] = useState('');
  const [showArtPaymentFlow, setShowArtPaymentFlow] = useState(false);
  const [generationsUsed, setGenerationsUsed] = useState(0);

  // Web3 and payment hooks
  const {
    address,
    isConnected,
    isCorrectChain,
    hasActiveSession,
    paymentSession,
    useGeneration,
    checkActiveSession,
    isLoadingSession,
    config,
    switchToCorrectChain,
    isSwitchingChain,
  } = useWeb3();

  const {
    payForGeneration,
    hasSufficientBalance,
    clearError,
    status: paymentStatus,
    error: paymentError,
    txHash,
    generationFeeUsdc,
    usdcBalanceFormatted,
    isBalanceLoading,
  } = useGenerationPayment();

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

  const handleExtractColors = async () => {
    const imageData = card.imageData || imagePreview;
    if (!imageData) return;

    setIsExtractingColors(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiBaseUrl}/api/extract-colors`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to extract colors');
      }

      const data = await response.json();

      // Update card with extracted colors and theme
      onUpdateFields({
        colors: data.colors,
        theme: data.theme
      });
    } catch (error) {
      console.error('Color extraction error:', error);
      alert('Failed to extract colors: ' + error.message);
    } finally {
      setIsExtractingColors(false);
    }
  };

  // Art generation handlers
  const handleGenerateArt = useCallback(async () => {
    if (!artPrompt.trim()) {
      setArtGenError('Please enter a prompt for art generation');
      return;
    }

    // Check if user needs to pay first
    if (!hasActiveSession) {
      setShowArtPaymentFlow(true);
      return;
    }

    setIsGeneratingArt(true);
    setArtGenError('');

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monsterNames: [artPrompt.trim()],
          sessionId: paymentSession?.id,
          walletAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'No generations remaining') {
          setArtGenError('No generations remaining. Please make a new payment.');
          setShowArtPaymentFlow(true);
          return;
        }
        throw new Error(data.error || data.message || 'Art generation failed');
      }

      if (data.success && data.cards.length > 0) {
        const generatedCard = data.cards[0];

        // Update card with generated image and colors
        onUpdateField('imageData', generatedCard.imageData);
        setImagePreview(generatedCard.imageData);

        if (generatedCard.colors) {
          onUpdateFields({
            colors: generatedCard.colors,
            theme: generatedCard.theme
          });
        }

        // Also update move name and flavor text if available
        if (generatedCard.moveName) {
          onUpdateField('moveName', generatedCard.moveName);
        }
        if (generatedCard.flavorText) {
          onUpdateField('flavorText', generatedCard.flavorText);
        }

        // Update local session state (decrement generations)
        useGeneration();
        setGenerationsUsed(prev => prev + 1);
      } else {
        setArtGenError('Art generation failed - no images returned');
      }
    } catch (error) {
      console.error('Art generation error:', error);
      setArtGenError(error.message || 'Art generation failed');
    } finally {
      setIsGeneratingArt(false);
    }
  }, [artPrompt, hasActiveSession, paymentSession, address, onUpdateField, onUpdateFields, useGeneration]);

  const handleArtPayment = useCallback(async () => {
    try {
      clearError();
      const result = await payForGeneration();
      console.log('Art generation payment successful:', result);
      setShowArtPaymentFlow(false);
      // Now trigger the generation
      await checkActiveSession();
    } catch (err) {
      console.error('Art payment failed:', err);
    }
  }, [payForGeneration, clearError, checkActiveSession]);

  const generationsRemaining = paymentSession?.generationsRemaining ?? 0;

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

            {/* AI Art Generation Section */}
            <div className="art-generation-section">
              <div className="art-gen-header">
                <span className="art-gen-icon">🎨</span>
                <span className="art-gen-title">Generate with AI</span>
              </div>

              {/* Session Status */}
              <div className="art-session-status">
                {isLoadingSession ? (
                  <span className="session-badge loading">Checking session...</span>
                ) : hasActiveSession ? (
                  <span className="session-badge active">
                    {generationsRemaining} generation{generationsRemaining !== 1 ? 's' : ''} remaining
                  </span>
                ) : (
                  <span className="session-badge inactive">Pay $2.50 for 3 generations</span>
                )}
              </div>

              {/* Payment Flow */}
              {showArtPaymentFlow && !hasActiveSession && (
                <div className="art-payment-flow">
                  <div className="payment-info">
                    <p>Generate AI artwork for your card!</p>
                    <ul>
                      <li>1 initial generation + 2 re-rolls</li>
                      <li>Powered by Google Imagen</li>
                    </ul>
                  </div>

                  {!isConnected ? (
                    <div className="connect-prompt">
                      <p>Connect your wallet to continue</p>
                      <appkit-button />
                    </div>
                  ) : !isCorrectChain ? (
                    <button
                      className="switch-network-btn"
                      onClick={switchToCorrectChain}
                      disabled={isSwitchingChain}
                    >
                      {isSwitchingChain ? 'Switching...' : 'Switch to Base Network'}
                    </button>
                  ) : !hasSufficientBalance() ? (
                    <div className="insufficient-balance">
                      <p>Insufficient USDC balance ({usdcBalanceFormatted} USDC)</p>
                      <a href="https://bridge.base.org" target="_blank" rel="noopener noreferrer">
                        Bridge to Base
                      </a>
                    </div>
                  ) : (
                    <button
                      className="pay-btn"
                      onClick={handleArtPayment}
                      disabled={paymentStatus !== 'idle' && paymentStatus !== 'error'}
                    >
                      {paymentStatus === 'paying' ? 'Confirm in Wallet...' :
                       paymentStatus === 'creating_session' ? 'Creating Session...' :
                       paymentStatus === 'verifying_payment' ? 'Verifying Payment...' :
                       `Pay ${generationFeeUsdc} USDC`}
                    </button>
                  )}

                  {paymentError && (
                    <div className="payment-error">{paymentError}</div>
                  )}

                  {txHash && (
                    <a
                      href={`https://basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      View transaction
                    </a>
                  )}

                  <button
                    className="cancel-payment-btn"
                    onClick={() => setShowArtPaymentFlow(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Art Prompt Input */}
              {!showArtPaymentFlow && (
                <div className="art-prompt-section">
                  <input
                    type="text"
                    className="art-prompt-input"
                    placeholder="Enter monster name or description..."
                    value={artPrompt}
                    onChange={(e) => setArtPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isGeneratingArt && handleGenerateArt()}
                    disabled={isGeneratingArt}
                  />

                  <button
                    className="generate-art-btn"
                    onClick={handleGenerateArt}
                    disabled={isGeneratingArt || !artPrompt.trim()}
                  >
                    {isGeneratingArt ? (
                      <>
                        <span className="spinner-small"></span>
                        Generating...
                      </>
                    ) : hasActiveSession ? (
                      'Generate Art'
                    ) : (
                      `Pay & Generate ($${generationFeeUsdc})`
                    )}
                  </button>

                  {artGenError && (
                    <div className="art-gen-error">{artGenError}</div>
                  )}

                  {isGeneratingArt && (
                    <div className="art-gen-progress">
                      <p>AI is creating your unique artwork...</p>
                      <p className="progress-hint">This may take 30-60 seconds</p>
                    </div>
                  )}
                </div>
              )}

              <div className="art-gen-divider">
                <span>or</span>
              </div>
            </div>

            {/* Original Upload Section */}
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
            {(card.imageData || imagePreview) && (
              <button
                className="extract-colors-btn"
                onClick={handleExtractColors}
                disabled={isExtractingColors}
              >
                {isExtractingColors ? '⏳ Extracting...' : '🎨 Extract Colors'}
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
                'stats.crit': Math.floor(Math.random() * 20) + 1
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
