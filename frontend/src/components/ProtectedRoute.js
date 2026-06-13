import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute
 * Wraps private routes. If no token is found in localStorage the user is
 * redirected to /login. The `replace` prop replaces the current history entry
 * so the user cannot hit the Back button to sneak back in.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('luckwin_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
