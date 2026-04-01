import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const callerId = extractUserId(token);
  if (!callerId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const body = await req.json();

  const { error } = await serviceClient()
    .from('profiles')
    .update(body)
    .eq('id', callerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
