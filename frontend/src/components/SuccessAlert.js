/**
 * Success Alert Component
 */
const SuccessAlert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
      <div className="flex justify-between items-start">
        <span>{message}</span>
        {onClose && (
          <button onClick={onClose} className="text-green-700 hover:text-green-900">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessAlert;
