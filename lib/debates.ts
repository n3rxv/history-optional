import { createServerClient } from '@/lib/supabase';

/**
 * The historiography bank: debates and the historians' positions on each.
 * Read on the server only. The page used to read it again from every
 * reader's browser on arrival, a full copy of both tables per visit, for
 * data that changes only when the owner edits it.
 */

export type Position = {
  id?: string;
  debate_id?: string;
  historian_name: string;
  stance: string;
  key_work: string;
  argument: string;
  school: string;
  argument_hi?: string | null;
  stance_hi?: string | null;
  key_work_hi?: string | null;
};

export type Debate = {
  id: string;
  title: string;
  period: string;
  paper: string;
  topics: string[];
  type: 'debate' | 'topic';
  upsc_tip: string;
  upsc_tip_hi?: string | null;
  title_hi?: string | null;
  positions: Position[];
};

export type DebateInput = Omit<Debate, 'id' | 'positions'> & { positions: Position[] };

const DEBATE_COLS = 'id, title, title_hi, period, paper, topics, type, upsc_tip, upsc_tip_hi';
const POSITION_COLS = 'id, debate_id, historian_name, stance, stance_hi, key_work, key_work_hi, argument, argument_hi, school';

export async function loadDebates(): Promise<Debate[]> {
  const db = createServerClient();
  const [{ data: debates, error: e1 }, { data: positions, error: e2 }] = await Promise.all([
    db.from('debates').select(DEBATE_COLS).order('created_at', { ascending: false }),
    db.from('positions').select(POSITION_COLS),
  ]);
  if (e1 || e2) throw new Error((e1 ?? e2)?.message);
  return (debates ?? []).map((d) => ({
    ...(d as Omit<Debate, 'positions'>),
    topics: (d as { topics: string[] | null }).topics ?? [],
    positions: (positions ?? []).filter((p) => p.debate_id === d.id) as Position[],
  }));
}
