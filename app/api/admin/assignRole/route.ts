import { supabaseAdmin } from '@/lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export async function handler( req: NextApiRequest,
  res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { targetUserId, role } = req.body;
  const allowedRoles = ['kid','parent','guardian','principal','class_teacher','teacher','external_educator','caregiver','admin'];
  if (!targetUserId || !allowedRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', targetUserId);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true });
}
