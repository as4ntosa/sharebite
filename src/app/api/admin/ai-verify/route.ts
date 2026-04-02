import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FEATHERLESS_API_KEY = 'rc_82ef6597804cb6b2ab383a3b60d9d088c29c0a45e06d567d512066fbc7e70dcc';
const FEATHERLESS_API_URL = 'https://api.featherless.ai/v1/chat/completions';
const FEATHERLESS_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';

function serviceClient() {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function extractUserId(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

async function isAdmin(callerId: string): Promise<boolean> {
  const { data } = await serviceClient().from('profiles').select('is_admin').eq('id', callerId).single();
  return data?.is_admin === true;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const callerId = extractUserId(token);
  if (!callerId || !(await isAdmin(callerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const applicant = await req.json();

  const prompt = `You are a compliance reviewer for NibbleNet, a food surplus marketplace. Review this provider application and assess whether to approve or reject it.

APPLICATION:
- Name: ${applicant.name ?? '—'}
- Email: ${applicant.email ?? '—'}
- Business Name: ${applicant.business_name ?? '—'}
- Provider Type: ${applicant.provider_type ?? '—'}
- Address: ${[applicant.address, applicant.city, applicant.zip_code].filter(Boolean).join(', ') || '—'}
- License/Registration: ${applicant.license_number ?? 'Not provided'}
- Phone: ${applicant.phone ?? 'Not provided'}
- Safety Policy Accepted: ${applicant.safety_policy_accepted ? 'Yes' : 'No'}
- Integrity Policy Accepted: ${applicant.integrity_policy_accepted ? 'Yes' : 'No'}
- Food Safety Accepted: ${applicant.food_safety_accepted ? 'Yes' : 'No'}

Respond in this exact format:
RECOMMENDATION: approve | reject | review
RISK: low | medium | high
SUMMARY: One sentence summary of your assessment.
POSITIVES:
- bullet
CONCERNS:
- bullet`;

  try {
    const res = await fetch(FEATHERLESS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FEATHERLESS_API_KEY}`,
      },
      body: JSON.stringify({
        model: FEATHERLESS_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!res.ok) throw new Error(`API status ${res.status}`);

    const data = await res.json();
    const text: string = data.choices[0].message.content.trim();

    const recommendationMatch = text.match(/RECOMMENDATION:\s*(approve|reject|review)/i);
    const riskMatch = text.match(/RISK:\s*(low|medium|high)/i);
    const summaryMatch = text.match(/SUMMARY:\s*(.+)/i);
    const positivesMatch = text.match(/POSITIVES:\s*([\s\S]*?)(?=\nCONCERNS:)/i);
    const concernsMatch = text.match(/CONCERNS:\s*([\s\S]*?)$/i);

    const parseBullets = (s: string) =>
      s.split('\n').map((l) => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean);

    return NextResponse.json({
      recommendation: (recommendationMatch?.[1]?.toLowerCase() ?? 'review') as 'approve' | 'reject' | 'review',
      riskLevel: (riskMatch?.[1]?.toLowerCase() ?? 'medium') as 'low' | 'medium' | 'high',
      summary: summaryMatch?.[1]?.trim() ?? 'Unable to generate summary.',
      positives: positivesMatch ? parseBullets(positivesMatch[1]) : [],
      concerns: concernsMatch ? parseBullets(concernsMatch[1]) : [],
    });
  } catch {
    // Fallback: rule-based analysis
    const concerns: string[] = [];
    const positives: string[] = [];

    if (!applicant.license_number) concerns.push('No license or registration number provided');
    if (!applicant.phone) concerns.push('No phone number on file');
    if (!applicant.address) concerns.push('No address provided');
    if (!applicant.safety_policy_accepted) concerns.push('Safety policy not accepted');
    if (!applicant.integrity_policy_accepted) concerns.push('Integrity policy not accepted');
    if (!applicant.food_safety_accepted) concerns.push('Food safety policy not accepted');

    if (applicant.business_name) positives.push(`Named business: ${applicant.business_name}`);
    if (applicant.license_number) positives.push('License/registration number provided');
    if (applicant.safety_policy_accepted && applicant.integrity_policy_accepted && applicant.food_safety_accepted) {
      positives.push('All policies accepted');
    }
    if (applicant.address && applicant.city) positives.push('Complete address on file');

    const allPolicies = applicant.safety_policy_accepted && applicant.integrity_policy_accepted && applicant.food_safety_accepted;
    const riskLevel = concerns.length >= 3 ? 'high' : concerns.length >= 1 ? 'medium' : 'low';
    const recommendation = allPolicies && concerns.length === 0 ? 'approve' : concerns.length >= 3 ? 'reject' : 'review';

    return NextResponse.json({ recommendation, riskLevel, summary: 'AI analysis unavailable — rule-based fallback used.', positives, concerns });
  }
}
