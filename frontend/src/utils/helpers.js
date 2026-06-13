/**
 * Utility functions for the frontend
 */

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format date and time
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format currency
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'Rs. 0.00';
  
  // Rs. kiyala daala, agata satha ganath (.00) ekkama pennanna meka use karanawa
  return `Rs. ${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Calculate days between two dates
export const calculateDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

// Validate phone number (basic validation)
export const isValidPhone = (phone) => {
  return /^[0-9\-\+\(\)\s]+$/.test(phone) && phone.length >= 10;
};

// Validate NIC (basic validation)
export const isValidNIC = (nic) => {
  return nic.length >= 5;
};
