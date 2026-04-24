import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { visitor_id, page } = await req.json();
    if (!visitor_id) return NextResponse.json({ ok: false });

    const { data: existing } = await supabase
      .from('user_sessions')
      .select('id, visit_count')
      .eq('visitor_id', visitor_id)
      .single();

    if (existing) {
      await supabase
        .from('user_sessions')
        .update({
          visit_count: (existing.visit_count || 1) + 1,
          visited_at: new Date().toISOString(),
          last_page: page,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_sessions')
        .insert({
          visitor_id,
          visit_count: 1,
          visited_at: new Date().toISOString(),
          last_page: page,
        });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
