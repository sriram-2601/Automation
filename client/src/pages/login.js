import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore.js';
import { Workflow, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { login, loginWithSocial, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Clear errors on page mount
  useEffect(() => {
    clearError();
    setValidationError('');
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      router.push('/dashboard');
    }
  };

  const handleSocialLogin = async (provider) => {
    setValidationError('');
    clearError();
    const result = await loginWithSocial(provider);
    if (result.success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-fuchsia-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10">
        {/* Header/Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-600/20 mb-4">
            <Workflow className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-1">Access the Agentflow_AI operator console</p>
        </div>

        {/* Alerts */}
        {(error || validationError) && (
          <div className="p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
            {validationError || error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                placeholder="operator@agentflow.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-medium text-sm py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Social Sign In Separator */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-850"></div>
          </div>
          <span className="relative px-3 bg-[#0c1223] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Or continue with
          </span>
        </div>

        {/* Social Sign In Grid */}
        <div className="grid grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="flex items-center justify-center py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl hover:bg-slate-900/50 transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.03] active:scale-[0.97]"
            title="Sign in with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.37 0 3.42 2.67 1.48 6.578L5.266 9.765z"
              />
              <path
                fill="#4285F4"
                d="M24 12.273c0-.818-.082-1.636-.218-2.436H12v4.618h6.736a5.753 5.753 0 0 1-2.49 3.773l3.782 3.19C22.255 19.345 24 16.145 24 12.273z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235A7.126 7.126 0 0 1 4.909 12c0-.79.127-1.555.357-2.235L1.48 6.578A11.97 11.97 0 0 0 0 12c0 2.01.5 3.9 1.48 5.422l3.786-3.187z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.245 0 5.973-1.073 7.964-2.918l-3.782-3.19c-1.055.71-2.4.127-4.182.127-3.955 0-7.3-2.673-8.5-6.582L1.48 14.578C3.42 21.327 7.37 24 12 24z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('GitHub')}
            className="flex items-center justify-center py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl hover:bg-slate-900/50 transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.03] active:scale-[0.97]"
            title="Sign in with GitHub"
          >
            <svg className="w-5 h-5 fill-slate-300" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('Twitter')}
            className="flex items-center justify-center py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl hover:bg-slate-900/50 transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.03] active:scale-[0.97]"
            title="Sign in with Twitter"
          >
            <svg className="w-5 h-5 fill-slate-300" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('Facebook')}
            className="flex items-center justify-center py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl hover:bg-slate-900/50 transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.03] active:scale-[0.97]"
            title="Sign in with Facebook"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
          </button>
        </div>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Don't have an operator account?{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
