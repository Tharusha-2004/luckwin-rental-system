import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorAlert = ({ message }) => {
  return (
    <div className="flex items-center gap-2 p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-100">
      <AlertTriangle className="w-5 h-5" />
      <span>{message || "Mokak hari waraddak una!"}</span>
    </div>
  );
};

export default ErrorAlert;