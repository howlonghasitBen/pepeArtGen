import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { useCardEditor, CARD_PARTS } from '../../hooks/useCardEditor';
import { useMintCard } from '../../hooks/useMintCard';
import PartSelector from './PartSelector';
import PartEditor from './PartEditor';
import LiveCardPreview from './LiveCardPreview';
import MintingModal from '../MintingModal';
import MintSuccessModal from '../MintSuccessModal';
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

  // Minting state
  const [showMintingModal, setShowMintingModal] = useState(false);
  const [showMintSuccessModal, setShowMintSuccessModal] = useState(false);
  const [mintSuccessData, setMintSuccessData] = useState(null);

  // Mobile-specific state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPartEditorModalOpen, setIsPartEditorModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleMint = () => {
    // Validate card has required data
    if (!card.imageData) {
      setError('Please add an image to your card before minting');
      return;
    }
    if (!card.name || card.name === 'Untitled Card') {
      setError('Please give your card a name before minting');
      return;
    }
    setShowMintingModal(true);
  };

  const handleMintSuccess = (data) => {
    setShowMintingModal(false);
    setMintSuccessData(data);
    setShowMintSuccessModal(true);
  };

  const handleMintModalClose = () => {
    setShowMintingModal(false);
  };

  const handleMintSuccessClose = () => {
    setShowMintSuccessModal(false);
    setMintSuccessData(null);
    // Optionally call onSave or onBack after successful mint
    if (onSave) {
      onSave(card);
    }
  };

  // Handle part selection on mobile
  const handleSelectPart = (partKey) => {
    setSelectedPart(partKey);
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsPartEditorModalOpen(true);
    }
  };

  // Close part editor modal
  const handleClosePartEditorModal = () => {
    setIsPartEditorModalOpen(false);
  };

  return (
    <div className="card-editor-screen">
      {/* Header */}
      <div className="editor-header">
        <div className="editor-header-left">
          {/* Mobile menu toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            <span className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          {onBack && (
            <button className="editor-back-btn" onClick={onBack}>
              &lt; Back
            </button>
          )}
          <h2 className="editor-title">Card Editor</h2>
          {isDirty && <span className="unsaved-indicator">[*]</span>}
        </div>

        <div className="editor-header-actions">
          <button
            className="editor-btn secondary"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            &lt;
          </button>
          <button
            className="editor-btn secondary"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            &gt;
          </button>

          <div className="editor-btn-divider" />

          <button
            className="editor-btn secondary"
            onClick={() => setShowDrafts(!showDrafts)}
          >
            [F] <span className="btn-text">Drafts</span>
          </button>

          <button
            className="editor-btn secondary"
            onClick={handleExport}
          >
            [^] <span className="btn-text">Export</span>
          </button>

          <label className="editor-btn secondary import-btn">
            [v] <span className="btn-text">Import</span>
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
            [R] <span className="btn-text">Reset</span>
          </button>

          <button
            className="editor-btn primary"
            onClick={handleSave}
            disabled={!isConnected || isSaving}
          >
            {isSaving ? '...' : '[S]'} <span className="btn-text">{isSaving ? 'Saving' : 'Save'}</span>
          </button>

          <button
            className="editor-btn accent"
            onClick={handleMint}
            disabled={!isConnected}
          >
            [M] <span className="btn-text">Mint</span>
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="editor-error">
          {error}
          <button onClick={() => setError(null)}>x</button>
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
        {/* Mobile sidebar overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left panel - Part selector (collapsible on mobile) */}
        <div className={`editor-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header-mobile">
            <h3>Card Parts</h3>
            <button
              className="sidebar-close-btn"
              onClick={() => setIsSidebarOpen(false)}
            >
              x
            </button>
          </div>
          <PartSelector
            parts={CARD_PARTS}
            selectedPart={selectedPart}
            onSelectPart={handleSelectPart}
          />
        </div>

        {/* Center - Live preview */}
        <div className="editor-preview">
          <LiveCardPreview card={card} />

          {/* Mobile: Button to open part editor */}
          {isMobile && selectedPart && (
            <button
              className="mobile-edit-btn"
              onClick={() => setIsPartEditorModalOpen(true)}
            >
              [E] Edit {CARD_PARTS[selectedPart]?.label}
            </button>
          )}
        </div>

        {/* Right panel - Part editor (desktop only) */}
        <div className="editor-panel desktop-only">
          <PartEditor
            part={selectedPart}
            partSchema={CARD_PARTS[selectedPart]}
            card={card}
            onUpdateField={updateField}
            onUpdateFields={updateFields}
          />
        </div>
      </div>

      {/* Mobile Part Editor Modal */}
      {isMobile && isPartEditorModalOpen && (
        <div className="part-editor-modal-overlay" onClick={handleClosePartEditorModal}>
          <div className="part-editor-modal" onClick={e => e.stopPropagation()}>
            <div className="part-editor-modal-header">
              <div className="modal-header-title">
                <span className="modal-part-icon">{CARD_PARTS[selectedPart]?.icon}</span>
                <h3>{CARD_PARTS[selectedPart]?.label}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={handleClosePartEditorModal}
              >
                x
              </button>
            </div>
            <div className="part-editor-modal-content">
              <PartEditor
                part={selectedPart}
                partSchema={CARD_PARTS[selectedPart]}
                card={card}
                onUpdateField={updateField}
                onUpdateFields={updateFields}
              />
            </div>
            <div className="part-editor-modal-footer">
              <button
                className="modal-done-btn"
                onClick={handleClosePartEditorModal}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts modal */}
      {showDrafts && (
        <div className="drafts-modal-overlay" onClick={() => setShowDrafts(false)}>
          <div className="drafts-modal" onClick={e => e.stopPropagation()}>
            <div className="drafts-modal-header">
              <h3>Your Drafts</h3>
              <button onClick={() => setShowDrafts(false)}>x</button>
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

      {/* Minting Modal */}
      {showMintingModal && (
        <MintingModal
          cards={[card]}
          onClose={handleMintModalClose}
          onSuccess={handleMintSuccess}
        />
      )}

      {/* Mint Success Modal */}
      {showMintSuccessModal && mintSuccessData && (
        <MintSuccessModal
          mintData={mintSuccessData}
          onClose={handleMintSuccessClose}
        />
      )}
    </div>
  );
}

export default CardEditorScreen;
