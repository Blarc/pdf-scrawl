import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { API_URL } from '../config';
import { Surface } from './ui/Surface';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';

export function LoginView() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        await register(username, password);
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogleLogin = () => {
    const returnTo = encodeURIComponent(window.location.href);
    window.location.href = `${API_URL}/auth/google?returnTo=${returnTo}`;
  };

  return (
    <Surface level="base" className="flex flex-col items-center justify-center min-h-screen p-6">
      <Surface level="lowest" className="max-w-md w-full p-10 rounded-xl shadow-ambient border border-outline-variant border-opacity-10">
        <Typography level="display-lg" as="h2" className="text-on-surface opacity-10 text-center mb-2 select-none">
          SCRAWL
        </Typography>
        <Typography level="headline" as="h1" className="text-center mb-8 text-on-surface">
          {isRegistering ? 'Create an account' : 'Sign in to Scrawl'}
        </Typography>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Typography level="label-sm" as="label" className="text-on-surface opacity-60">
              Username
            </Typography>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-container-highest border-none focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm font-inter"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Typography level="label-sm" as="label" className="text-on-surface opacity-60">
              Password
            </Typography>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-container-highest border-none focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm font-inter"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <Typography level="body" className="text-error text-xs font-medium bg-error bg-opacity-5 p-2 rounded border border-error border-opacity-10">
              {error}
            </Typography>
          )}

          <Button type="submit" variant="primary" size="lg" className="mt-2">
            {isRegistering ? 'Register' : 'Login'}
          </Button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Typography level="label-sm" className="text-on-surface opacity-30">
            Or continue with
          </Typography>
          <Button
            onClick={handleGoogleLogin}
            variant="secondary"
            size="lg"
            className="w-full flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957a8.996 8.996 0 000 8.088l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.017.957 4.956L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
        </div>

        <Typography level="body" className="block text-center mt-8 text-on-surface opacity-60">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-primary cursor-pointer font-bold hover:underline"
          >
            {isRegistering ? 'Sign in here' : 'Register here'}
          </span>
        </Typography>
      </Surface>
    </Surface>
  );
}
