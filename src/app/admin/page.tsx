'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Users, RefreshCw, ChevronRight, FileText, MapPin, Phone, Mail, X, Sparkles, AlertTriangle, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Applicant {
  id: string;
  name: string;
  email: string | null;
  business_name: string | null;
  provider_type: string | null;
  address: string | null;
  license_number: string | null;
  city: string | null;
  zip_code: string | null;
  phone: string | null;
  safety_policy_accepted: boolean;
  integrity_policy_accepted: boolean;
  food_safety_accepted: boolean;
  created_at: string;
}

interface AiResult {
  recommendation: 'approve' | 'reject' | 'review';
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  positives: string[];
  concerns: string[];
}

function DetailModal({ applicant, onClose, onApprove, onReject, onAiVerify, acting, verifying, aiResult, done }: {
  applicant: Applicant;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAiVerify: (applicant: Applicant) => void;
  acting: boolean;
  verifying: boolean;
  aiResult: AiResult | null;
  done?: 'approved' | 'rejected';
}) {
  const result = done;

  const riskColor = {
    low: 'text-brand-600 bg-brand-50',
    medium: 'text-amber-600 bg-amber-50',
    high: 'text-red-600 bg-red-50',
  };

  const recommendationIcon = {
    approve: <ShieldCheck size={15} className="text-brand-600" />,
    reject: <ShieldAlert size={15} className="text-red-500" />,
    review: <ShieldQuestion size={15} className="text-amber-500" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-sm rounded-t-3xl p-5 pb-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{applicant.name}</h2>
            {applicant.email && <p className="text-xs text-gray-400">{applicant.email}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <X size={15} />
          </button>
        </div>

        {/* Application details */}
        <div className="space-y-3 mb-5">
          {/* Provider type */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Provider Type</p>
            <p className="text-sm font-semibold text-gray-800">
              {applicant.provider_type === 'Restaurant' ? '🍽️' : applicant.provider_type === 'Grocery Store' ? '🛒' : '🏠'}{' '}
              {applicant.provider_type ?? '—'}
            </p>
          </div>

          {/* Business */}
          {applicant.business_name && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Business Name</p>
              <p className="text-sm text-gray-800">{applicant.business_name}</p>
            </div>
          )}

          {/* Contact info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Contact</p>
            {applicant.email && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail size={13} className="text-gray-400 shrink-0" />
                {applicant.email}
              </div>
            )}
            {applicant.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone size={13} className="text-gray-400 shrink-0" />
                {applicant.phone}
              </div>
            )}
          </div>

          {/* Address */}
          {(applicant.address || applicant.city) && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Address</p>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                <span>
                  {[applicant.address, applicant.city, applicant.zip_code].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* License */}
          {applicant.license_number && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">License / Registration</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FileText size={13} className="text-gray-400 shrink-0" />
                {applicant.license_number}
              </div>
            </div>
          )}

          {/* Policy agreements */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Policy Agreements</p>
            <div className="space-y-1.5">
              {[
                { label: 'Safety & Integrity Policy', accepted: applicant.integrity_policy_accepted },
                { label: 'Food Safety Standards', accepted: applicant.food_safety_accepted },
                { label: 'Safety Policy', accepted: applicant.safety_policy_accepted },
              ].map(({ label, accepted }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-700">
                  {accepted
                    ? <CheckCircle size={13} className="text-brand-600 shrink-0" />
                    : <XCircle size={13} className="text-red-400 shrink-0" />
                  }
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Applied date */}
          <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
            <Clock size={12} />
            Applied {new Date(applicant.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* AI Result card */}
        {aiResult && (
          <div className="mb-4 rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <Sparkles size={14} className="text-purple-500" />
              <span className="text-xs font-semibold text-gray-700">AI Verification Result</span>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${riskColor[aiResult.riskLevel]}`}>
                {aiResult.riskLevel.toUpperCase()} RISK
              </span>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-start gap-2">
                {recommendationIcon[aiResult.recommendation]}
                <p className="text-xs text-gray-700 leading-relaxed">{aiResult.summary}</p>
              </div>
              {aiResult.positives.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wide mb-1">Positives</p>
                  <ul className="space-y-1">
                    {aiResult.positives.map((p, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <CheckCircle size={11} className="text-brand-500 shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiResult.concerns.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Concerns</p>
                  <ul className="space-y-1">
                    {aiResult.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {result ? (
          <div className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm ${
            result === 'approved' ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'
          }`}>
            {result === 'approved' ? <><CheckCircle size={16} /> Approved</> : <><XCircle size={16} /> Rejected</>}
          </div>
        ) : (
          <div className="space-y-2">
            {!aiResult && (
              <button
                onClick={() => onAiVerify(applicant)}
                disabled={verifying}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-purple-200 bg-purple-50 text-purple-700 text-sm font-semibold hover:bg-purple-100 transition-colors disabled:opacity-60"
              >
                {verifying ? (
                  <><div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Analyzing…</>
                ) : (
                  <><Sparkles size={15} /> AI Verify</>
                )}
              </button>
            )}
            <div className="flex gap-2">
              <Button fullWidth size="lg" loading={acting} onClick={() => onApprove(applicant.id)}>
                Approve
              </Button>
              <Button fullWidth size="lg" variant="outline" loading={acting} onClick={() => onReject(applicant.id)}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, accessToken } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<Applicant | null>(null);
  const [acting, setActing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [done, setDone] = useState<Record<string, 'approved' | 'rejected'>>({});

  useEffect(() => {
    if (loading) return;
    if (!user?.isAdmin) { router.replace('/home'); return; }
    loadApplicants();
  }, [user, loading]);

  const loadApplicants = async () => {
    if (!supabase) return;
    setFetching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, business_name, provider_type, address, license_number, city, zip_code, phone, safety_policy_accepted, integrity_policy_accepted, food_safety_accepted, created_at')
      .eq('provider_status', 'pending')
      .order('created_at', { ascending: true });
    setApplicants(data ?? []);
    setFetching(false);
  };

  const handleAiVerify = async (applicant: Applicant) => {
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/ai-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(applicant),
      });
      if (res.ok) {
        const result: AiResult = await res.json();
        setAiResult(result);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActing(true);
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) setDone((d) => ({ ...d, [userId]: 'approved' }));
    setActing(false);
  };

  const handleReject = async (userId: string) => {
    setActing(true);
    const res = await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) setDone((d) => ({ ...d, [userId]: 'rejected' }));
    setActing(false);
  };

  if (loading || !user?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Provider Applications</h1>
          <p className="text-sm text-gray-500">
            {fetching ? 'Loading…' : `${applicants.length} pending`}
          </p>
        </div>
        <button
          onClick={loadApplicants}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-400 hover:text-gray-600"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {fetching ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mb-3">
            <Users size={24} className="text-brand-600" />
          </div>
          <p className="text-sm font-medium text-gray-700">No pending applications</p>
          <p className="text-xs text-gray-400 mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map((a) => {
            const result = done[a.id];
            return (
              <button
                key={a.id}
                className="w-full bg-white rounded-2xl p-4 shadow-sm text-left flex items-center gap-3"
                onClick={() => { setSelected(a); setAiResult(null); }}
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0 text-lg">
                  {a.provider_type === 'Restaurant' ? '🍽️' : a.provider_type === 'Grocery Store' ? '🛒' : '🏠'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{a.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {a.business_name ?? a.provider_type ?? 'Provider'} · {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                {result ? (
                  result === 'approved'
                    ? <CheckCircle size={18} className="text-brand-600 shrink-0" />
                    : <XCircle size={18} className="text-red-400 shrink-0" />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-amber-600 font-medium">Pending</span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <DetailModal
          applicant={selected}
          onClose={() => { setSelected(null); setAiResult(null); }}
          onApprove={handleApprove}
          onReject={handleReject}
          onAiVerify={handleAiVerify}
          acting={acting}
          verifying={verifying}
          aiResult={aiResult}
          done={done[selected.id]}
        />
      )}
    </div>
  );
}
