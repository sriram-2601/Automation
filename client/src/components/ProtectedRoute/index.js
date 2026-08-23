import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore.js';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, initAuth } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      initAuth();
    }
  }, [isHydrated, initAuth]);

  useEffect(() => {
    // If hydration has run and user is not authenticated, send to login
    if (isHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  // Render a loading spinner during session restoration or redirection
  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Restoring agent session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
