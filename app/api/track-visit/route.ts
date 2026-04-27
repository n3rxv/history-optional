import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest) {
  try {
    const { visitor_id, page, referrer } = await req.json();
    if (!visitor_id) return NextResponse.json({ ok: false, reason: 'no visitor_id' });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) return NextResponse.json({ ok: false, reason: 'missing env', url: !!url, key: !!key });
    const supabase = createClient(url, key);
    const { data: existing, error: selectError } = await supabase
      .from('user_sessions')
      .select('id, visit_count')
      .eq('visitor_id', visitor_id)
      .single();
    if (selectError && selectError.code !== 'PGRST116') {
      return NextResponse.json({ ok: false, reason: 'select error', error: selectError.message });
    }
    if (existing) {
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({
          visit_count: (existing.visit_count || 1) + 1,
          visited_at: new Date().toISOString(),
          last_page: page,
        })
        .eq('id', existing.id);
      if (updateError) return NextResponse.json({ ok: false, reason: 'update error', error: updateError.message });
    } else {
      const { error: insertError } = await supabase
        .from('user_sessions')
        .insert({
          visitor_id,
          visit_count: 1,
          visited_at: new Date().toISOString(),
          last_page: page,
          referrer: referrer || 'direct',
        });
      if (insertError) return NextResponse.json({ ok: false, reason: 'insert error', error: insertError.message });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: 'exception', error: e.message });
  }
}
