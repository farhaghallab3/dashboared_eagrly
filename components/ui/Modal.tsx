import React from 'react';
import { MdClose } from 'react-icons/md';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl backdrop-blur-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card)'
        }}
      >
        <div
          className="flex items-center justify-between mb-6 pb-4"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="transition-colors duration-300 p-1 rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MdClose size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
