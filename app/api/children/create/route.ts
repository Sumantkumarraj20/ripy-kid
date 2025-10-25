import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, dob, gender } = req.body;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const child_id = uuidv4();

  const { error } = await supabase.from('children').insert([{
    id: child_id,
    name,
    dob,
    gender,
    created_by: user.id
  }]);
  if (error) return res.status(500).json({ error: error.message });

  // Update parent's children_ids
  const { data: profileData, error: fetchError } = await supabase
    .from('profiles')
    .select('children_ids')
    .eq('id', user.id)
    .single();

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  const existingChildren = profileData?.children_ids || [];
  await supabase
    .from('profiles')
    .update({ children_ids: [...existingChildren, child_id] })
    .eq('id', user.id);

  res.status(200).json({ ok: true, child_id });
}
