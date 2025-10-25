import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import type { NextApiRequest, NextApiResponse } from 'next';

export async function handler(req: NextApiRequest,
  res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { child_id, date, activity_counts, avg_scores, milestone_list, growth } = req.body;

  const user = await supabase.auth.getUser();
  if (!user.data.user) return res.status(401).json({ error: 'Not authenticated' });

  const { error } = await supabase.from('daily_summaries').insert([{
    id: uuidv4(),
    child_id,
    date,
    activity_counts,
    avg_scores,
    milestone_list,
    growth,
    created_by: user.data.user.id
  }]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true });
}
