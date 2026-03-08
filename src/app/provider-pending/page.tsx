'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle, Leaf, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function ProviderPendingPage() {
  const router = useRouter();
  const { user, approveProvider } = useAuth();
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    // If already approved and in provider mode, go to dashboard.
    // If approved but still in consumer mode, stay here until they choose to switch.
    if (user?.providerStatus === 'approved' && user?.currentMode === 'provider') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleDemoApprove = async () => {
    setApproving(true);
    await new Promise((r) => setTimeout(r, 1200));
    approveProvider(); // sets providerStatus='approved', currentMode stays 'consumer'
    // Land on home — the mode switcher will appear and the user can choose to switch
    router.replace('/home');
  };

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

        {/* Status card */}
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

        {/* Demo approval button */}
        <div className="w-full max-w-xs bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={14} className="text-amber-600" />
            <p className="text-xs font-bold text-amber-700">Prototype / Demo Mode</p>
          </div>
          <p className="text-xs text-amber-600 mb-3 leading-relaxed">
            In a real deployment, approval happens via our admin team. For this prototype, click below to instantly simulate approval. After approval, a mode switcher will appear so you can toggle between Consumer and Provider tools.
          </p>
          <Button fullWidth size="sm" loading={approving} onClick={handleDemoApprove}>
            Simulate Approval
          </Button>
        </div>

        <Link href="/home" className="text-sm text-gray-400 hover:text-gray-600">
          Return to browsing
        </Link>
      </div>
    </div>
  );
}
