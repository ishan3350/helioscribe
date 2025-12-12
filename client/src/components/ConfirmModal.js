import React, { useState, useEffect } from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', requireConfirmation = false, confirmationText = '' }) => {
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (confirmationText) {
      navigator.clipboard.writeText(confirmationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isConfirmDisabled = requireConfirmation && inputValue !== confirmationText;

  const handleConfirm = () => {
    if (!isConfirmDisabled) {
      onConfirm();
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className={`modal-icon ${variant}`}>
            {variant === 'danger' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
              </svg>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        
        <div className="modal-content">
          <h2 className="modal-title">{title}</h2>
          <p className="modal-message">{message}</p>
          
          {requireConfirmation && confirmationText && (
            <div className="confirmation-section">
              <label className="confirmation-label">
                Type <strong>{confirmationText}</strong> to confirm:
              </label>
              <div className="confirmation-input-wrapper">
                <input
                  type="text"
                  className="confirmation-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={confirmationText}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-copy"
                  onClick={handleCopy}
                  title="Copy domain name"
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className={`btn-confirm btn-${variant}`} 
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

