import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useCardEditor, CARD_PARTS } from '../../hooks/useCardEditor';
import PartSelector from './PartSelector';
import PartEditor from './PartEditor';
import LiveCardPreview from './LiveCardPreview';
import './CardEditorScreen.css';

function CardEditorScreen({ initialCard, onSave, onBack }) {
  const { address, isConnected } = useWeb3();
  const {
    card,
    updateField,
    updateFields,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedPart,
    setSelectedPart,
    isDirty,
    isSaving,
    lastSaved,
    saveDraft,
    loadDraft,
    getDrafts,
    resetCard,
    loadCard,
    exportCard,
    importCard
  } = useCardEditor(initialCard);

  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [error, setError] = useState(null);

  // Load drafts when panel opens
  useEffect(() => {
    if (showDrafts && address) {
      setIsLoadingDrafts(true);
      getDrafts()
        .then(setDrafts)
        .catch(err => setError(err.message))
        .finally(() => setIsLoadingDrafts(false));
    }
  }, [showDrafts, address, getDrafts]);

  const handleSave = async () => {
    try {
      await saveDraft();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = () => {
    exportCard();
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = importCard(event.target.result);
      if (!success) {
        setError('Failed to import card. Invalid format.');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDraft = async (draftId) => {
    try {
      await loadDraft(draftId);
      setShowDrafts(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFinish = () => {
    if (onSave) {
      onSave(card);
    }
  };

  return (
    <div className="card-editor-screen">
      {/* Header */}
      <div className="editor-header">
        <div className="editor-header-left">
          {onBack && (
            <button className="editor-back-btn" onClick={onBack}>
              ← Back
            </button>
          )}
          <h2 className="editor-title">Card Editor</h2>
          {isDirty && <span className="unsaved-indicator">●</span>}
        </div>

        <div className="editor-header-actions">
          <button
            className="editor-btn secondary"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            className="editor-btn secondary"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>

          <div className="editor-btn-divider" />

          <button
            className="editor-btn secondary"
            onClick={() => setShowDrafts(!showDrafts)}
          >
            📁 Drafts
          </button>

          <button
            className="editor-btn secondary"
            onClick={handleExport}
          >
            📤 Export
          </button>

          <label className="editor-btn secondary import-btn">
            📥 Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>

          <div className="editor-btn-divider" />

          <button
            className="editor-btn secondary"
            onClick={resetCard}
          >
            🔄 Reset
          </button>

          <button
            className="editor-btn primary"
            onClick={handleSave}
            disabled={!isConnected || isSaving}
          >
            {isSaving ? 'Saving...' : '💾 Save'}
          </button>

          {onSave && (
            <button
              className="editor-btn accent"
              onClick={handleFinish}
            >
              ✓ Done
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="editor-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Last saved indicator */}
      {lastSaved && (
        <div className="last-saved">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Main editor layout */}
      <div className="editor-main">
        {/* Left panel - Part selector */}
        <div className="editor-sidebar">
          <PartSelector
            parts={CARD_PARTS}
            selectedPart={selectedPart}
            onSelectPart={setSelectedPart}
          />
        </div>

        {/* Center - Live preview */}
        <div className="editor-preview">
          <LiveCardPreview card={card} />
        </div>

        {/* Right panel - Part editor */}
        <div className="editor-panel">
          <PartEditor
            part={selectedPart}
            partSchema={CARD_PARTS[selectedPart]}
            card={card}
            onUpdateField={updateField}
            onUpdateFields={updateFields}
          />
        </div>
      </div>

      {/* Drafts modal */}
      {showDrafts && (
        <div className="drafts-modal-overlay" onClick={() => setShowDrafts(false)}>
          <div className="drafts-modal" onClick={e => e.stopPropagation()}>
            <div className="drafts-modal-header">
              <h3>Your Drafts</h3>
              <button onClick={() => setShowDrafts(false)}>×</button>
            </div>

            <div className="drafts-list">
              {isLoadingDrafts ? (
                <div className="drafts-loading">Loading drafts...</div>
              ) : drafts.length === 0 ? (
                <div className="drafts-empty">No saved drafts yet.</div>
              ) : (
                drafts.map(draft => (
                  <div
                    key={draft.id}
                    className="draft-item"
                    onClick={() => handleLoadDraft(draft.id)}
                  >
                    <div className="draft-name">{draft.name}</div>
                    <div className="draft-date">
                      {new Date(draft.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardEditorScreen;
