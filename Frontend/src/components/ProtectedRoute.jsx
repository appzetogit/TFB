import { Navigate, useLocation } from "react-router-dom";
import { isModuleAuthenticated } from "@/lib/utils/auth";
import Loader from "@/components/Loader";
import { useFirebaseUserSession } from "@/lib/firebaseUserSession";

/**
 * Role-based Protected Route Component
 * Only allows access if user is authenticated for the specific module
 */
export default function ProtectedRoute({ children, requiredRole, loginPath }) {
  const location = useLocation();
  const firebaseUserSession = useFirebaseUserSession();
  const isAuthenticated = isModuleAuthenticated(requiredRole);

  // Check if user is authenticated for required module
  if (!requiredRole) {
    // If no role required, allow access
    return children;
  }

  // Simplified: Don't wait for Firebase restore for user module
  // Firebase session restoration was blocking normal login flow
  if (!isAuthenticated) {
    // If not authenticated, redirect to login
    if (loginPath) {
      return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
    }

    // Fallback: redirect to appropriate login page
    const roleLoginPaths = {
      'admin': '/admin/login',
      'restaurant': '/restaurant/login',
      'delivery': '/delivery/sign-in',
      'user': '/auth/sign-in'
    };

    const redirectPath = roleLoginPaths[requiredRole] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

