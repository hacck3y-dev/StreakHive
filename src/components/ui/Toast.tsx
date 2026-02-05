import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'info' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose?: () => void;
}

// Simple icon components
const CheckIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const InfoIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const AlertIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const icons = {
  success: CheckIcon,
  info: InfoIcon,
  error: AlertIcon,
};

const colors = {
  success: { text: '#F2C94C', bg: 'rgba(242, 201, 76, 0.1)', border: 'rgba(242, 201, 76, 0.3)' },
  info: { text: '#60A5FA', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.3)' },
  error: { text: '#F87171', bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.3)' },
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose
}) => {
  const Icon = icons[type];
  const color = colors[type];

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full border flex items-center gap-3"
      style={{
        color: color.text,
        backgroundColor: color.bg,
        borderColor: color.border,
        animation: 'toastSlideDown 0.3s ease-out'
      }}
    >
      <Icon size={18} />
      <span className="text-sm font-medium" style={{ color: '#F4F6F8' }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: '#F4F6F8' }}
        >
          ×
        </button>
      )}

      <style>{`
        @keyframes toastSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
};
