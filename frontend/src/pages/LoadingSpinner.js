import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center p-10">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );
};

export default LoadingSpinner;