import React, { useEffect } from 'react';
import { MdCheckCircle } from 'react-icons/md';

interface SuccessAnimationProps {
    message: string;
    onComplete?: () => void;
    duration?: number;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
    message,
    onComplete,
    duration = 2000
}) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete?.();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="flex flex-col items-center gap-4 p-8 rounded-2xl animate-pulse"
                style={{
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 0 60px rgba(255, 179, 0, 0.3)'
                }}
            >
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                        animation: 'successPop 0.5s ease-out'
                    }}
                >
                    <MdCheckCircle size={48} style={{ color: 'var(--bg-primary)' }} />
                </div>
                <p className="text-lg font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
                    {message}
                </p>
            </div>

            <style>{`
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default SuccessAnimation;
