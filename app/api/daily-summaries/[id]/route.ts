import { supabase } from '@/lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export async function handler(req: NextApiRequest,
  res: NextApiResponse) {
  const { id } = req.query;
  const user = await supabase.auth.getUser();
  if (!user.data.user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('daily_summaries')
      .select('*').eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data[0] || null);
  }

  if (req.method === 'PUT') {
    const { activity_counts, avg_scores, milestone_list, growth } = req.body;
    const { error } = await supabase.from('daily_summaries').update({
      activity_counts, avg_scores, milestone_list, growth
    }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('daily_summaries').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
