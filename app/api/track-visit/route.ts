import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function parseCountry(req: NextRequest): { country: string; city: string } {
  const country = req.headers.get('x-vercel-ip-country') || 'unknown';
  const city = req.headers.get('x-vercel-ip-city') || 'unknown';
  return { country, city };
}

// PATCH — heartbeat to update last_active and session_duration
export async function PATCH(req: NextRequest) {
  try {
    const { visitor_id } = await req.json();
    if (!visitor_id) return NextResponse.json({ ok: false });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
    const { data: existing } = await supabase
      .from('user_sessions')
      .select('id, session_start, last_active')
      .eq('visitor_id', visitor_id)
      .single();
    if (!existing) return NextResponse.json({ ok: false });
    const now = new Date();
    const start = existing.session_start ? new Date(existing.session_start) : now;
    const duration = Math.floor((now.getTime() - start.getTime()) / 1000);
    await supabase
      .from('user_sessions')
      .update({
        last_active: now.toISOString(),
        session_duration_secs: duration,
      })
      .eq('id', existing.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

// POST — page visit
export async function POST(req: NextRequest) {
  try {
    const { visitor_id, page, referrer, device, os, browser, is_first_visit } = await req.json();
    if (!visitor_id) return NextResponse.json({ ok: false, reason: 'no visitor_id' });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) return NextResponse.json({ ok: false, reason: 'missing env' });
    const supabase = createClient(url, key);
    const { country, city } = parseCountry(req);
    const now = new Date().toISOString();

    const { data: existing, error: selectError } = await supabase
      .from('user_sessions')
      .select('id, visit_count, pages_visited, session_start')
      .eq('visitor_id', visitor_id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      return NextResponse.json({ ok: false, reason: 'select error', error: selectError.message });
    }

    if (existing) {
      const pages = existing.pages_visited || [];
      if (!pages.includes(page)) pages.push(page);
      const start = existing.session_start ? new Date(existing.session_start) : new Date();
      const duration = Math.floor((new Date().getTime() - start.getTime()) / 1000);
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({
          visit_count: (existing.visit_count || 1) + 1,
          visited_at: now,
          last_active: now,
          last_page: page,
          exit_page: page,
          pages_visited: pages,
          session_duration_secs: duration,
          is_bounce: pages.length <= 1,
        })
        .eq('id', existing.id);
      if (updateError) return NextResponse.json({ ok: false, reason: 'update error', error: updateError.message });
    } else {
      const { error: insertError } = await supabase
        .from('user_sessions')
        .insert({
          visitor_id,
          visit_count: 1,
          visited_at: now,
          last_active: now,
          session_start: now,
          last_page: page,
          entry_page: page,
          exit_page: page,
          pages_visited: [page],
          referrer: referrer || 'direct',
          device: device || 'unknown',
          os: os || 'unknown',
          browser: browser || 'unknown',
          country,
          city,
          is_bounce: true,
        });
      if (insertError) return NextResponse.json({ ok: false, reason: 'insert error', error: insertError.message });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: 'exception', error: e.message });
  }
}
