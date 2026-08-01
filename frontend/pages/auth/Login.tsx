import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { API_ENDPOINTS, apiClient, sessionManager, SESSION_KEYS } from '../../config';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await apiClient.post(API_ENDPOINTS.AUTH_LOGIN, {
        username,
        password
      });

      if (result.success) {
        sessionManager.setUser({
          id: result.data.id,
          username: result.data.username,
          permissions: result.data.permissions,
          userType: result.data.userType,
          branchId: result.data.branchId,
          branch: result.data.branch
        });

        try {
          const settingsResult = await apiClient.get(API_ENDPOINTS.SETTINGS_PRINT);
          if (settingsResult.success && settingsResult.data) {
            sessionStorage.setItem(SESSION_KEYS.PRINT_SETTINGS, JSON.stringify(settingsResult.data));
          }
        } catch (settingsError) {
          console.error('Failed to load print settings:', settingsError);
        }

        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
          localStorage.setItem('rememberedPassword', btoa(password));
        } else {
          localStorage.removeItem('rememberedUsername');
          localStorage.removeItem('rememberedPassword');
        }

        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
    if (rememberedPassword) {
      try {
        setPassword(atob(rememberedPassword));
      } catch (e) {
        localStorage.removeItem('rememberedPassword');
      }
    }
  }, []);

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden">
      {/* Full-bleed cover background */}
      <img
        src="/assets/login-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden="true"
      />
      {/* Soft overlays so the cover stays visible but the form stays readable */}
      <div className="absolute inset-0 bg-[#0a1628]/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/80 via-[#0a1628]/40 to-[#0a1628]/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/70 via-transparent to-[#0a1628]/30" />

      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        {/* Brand panel — keeps cover art visible on the left */}
        <div className="hidden lg:flex lg:w-[55%] flex-col justify-end p-12 xl:p-16">
          <div className="max-w-lg space-y-4">
            <img
              src="/assets/logo.png"
              alt="marctober"
              className="h-16 w-auto object-contain drop-shadow-lg"
            />
            <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-md">
              marctober
            </h1>
            <p className="text-lg font-medium text-sky-200/90">
              Marctober Phone & Service POS
            </p>
            <p className="max-w-md text-sm leading-relaxed text-slate-200/80">
              Streamline sales, inventory, and service operations in one place.
            </p>
          </div>
        </div>

        {/* Login form panel */}
        <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-10 lg:w-[45%] lg:justify-end lg:pr-12 xl:pr-20">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/95 p-8 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-10">
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-5 flex justify-center lg:justify-start">
                <img
                  src="/assets/logo.png"
                  alt="marctober"
                  className="h-14 w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                marctober
              </h2>
              <p className="mt-1 text-sm font-medium text-sky-700">
                Marctober Phone & Service POS
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Sign in to access your dashboard
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-3 pr-11 text-slate-900 placeholder-slate-400 transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                  Save Username and Password
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition-colors hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
