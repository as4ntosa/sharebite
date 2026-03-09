'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, signup, user, loading } = useAuth();

  const [tab, setTab] = useState<'login' | 'signup'>(
    params.get('tab') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (!user.city) { router.replace('/onboarding'); return; }
      // Respect the user's last active mode on login
      if (user.providerStatus === 'approved' && user.currentMode === 'provider') {
        router.replace('/dashboard');
      } else {
        router.replace('/home');
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your name');
        await signup(email, password, name);
        // signup sets user via persistLocal; useEffect above handles redirect
      }
    } catch (err: any) {
      const msg: string = err.message ?? 'Something went wrong';
      if (msg.toLowerCase().includes('check your email') || msg.toLowerCase().includes('confirm')) {
        setInfo(msg);
        setTab('login');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      <div className="px-5 pt-10 pb-6 text-center">
        <Link href="/" className="inline-flex mb-5">
          <Logo size={44} showName showBrand />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {tab === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {tab === 'login' ? 'Sign in to continue' : 'Start finding surplus food today'}
        </p>
      </div>

      <div className="flex-1 px-5 max-w-sm mx-auto w-full">
        {tab === 'login' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
            <p className="font-semibold mb-1">Demo account:</p>
            <p><strong>demo@nibblen.com</strong> / demo123</p>
          </div>
        )}

        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'signup' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
            }`}
          >
            Sign Up
          </button>
        </div>

        {info && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <AlertCircle size={15} className="text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700">{info}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'signup' && (
            <Input
              label="Full Name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" fullWidth size="lg" loading={submitting} className="mt-2">
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-5">
          By continuing, you agree to our{' '}
          <span className="text-brand-600 cursor-pointer hover:underline">Terms of Service</span>{' '}
          and{' '}
          <span className="text-brand-600 cursor-pointer hover:underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
