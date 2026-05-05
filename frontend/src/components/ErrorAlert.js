/**
 * Error Alert Component
 */
const ErrorAlert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      <div className="flex justify-between items-start">
        <span>{message}</span>
        {onClose && (
          <button onClick={onClose} className="text-red-700 hover:text-red-900">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
