'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

export default function ProviderPendingPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    if (user?.providerStatus === 'approved' && user?.currentMode === 'provider') {
      router.replace('/dashboard');
    }
    if (user?.providerStatus === 'approved') {
      router.replace('/home');
    }
    if (user?.providerStatus === 'rejected') {
      setRejected(true);
    }
  }, [user, router]);

  // Real-time subscription: detect when an admin approves or rejects
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase || !user?.id) return;

    const channel = supabase
      .channel('profile-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const status = payload.new.provider_status;
          if (status === 'approved') {
            updateProfile({ providerStatus: 'approved', canProvide: true });
            router.replace('/home');
          } else if (status === 'rejected') {
            updateProfile({ providerStatus: 'rejected' });
            setRejected(true);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  if (rejected) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <XCircle size={36} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Not Approved</h1>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-8">
            Unfortunately your provider application was not approved at this time. You can reapply or contact support for more information.
          </p>
          <Link href="/home" className="text-sm text-brand-600 font-medium">
            Return to browsing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mb-6">
          <Clock size={36} className="text-brand-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h1>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-8">
          Thank you for applying to become a NibbleNet provider. Our team will review your application and respond within 1–3 business days.
        </p>

        {/* Status steps */}
        <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-5 mb-8 text-left space-y-4">
          {[
            { icon: CheckCircle, color: 'text-brand-600 bg-brand-100', label: 'Application received', done: true },
            { icon: ShieldCheck, color: 'text-brand-600 bg-brand-100', label: 'Identity & policy review', done: true },
            { icon: Clock, color: 'text-amber-500 bg-amber-100', label: 'Manual approval — pending', done: false },
          ].map(({ icon: Icon, color, label, done }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={15} />
              </div>
              <span className={`text-sm font-medium ${done ? 'text-gray-800' : 'text-amber-600'}`}>{label}</span>
            </div>
          ))}
        </div>

        {isSupabaseEnabled && (
          <p className="text-xs text-gray-400 mb-6 max-w-xs leading-relaxed">
            This page will update automatically when your application is reviewed.
          </p>
        )}

        <Link href="/home" className="text-sm text-gray-400 hover:text-gray-600">
          Return to browsing
        </Link>
      </div>
    </div>
  );
}
