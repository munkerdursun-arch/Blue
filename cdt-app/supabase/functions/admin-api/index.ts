// =====================================================================
// Formation CDT : fonction d'administration (Supabase Edge Function)
//  - bootstrap : lien d'activation ou de récupération du compte administrateur
//                (protégé par le code d'installation, à garder secret)
//  - seed      : charge le contenu de la formation (code d'installation)
//  - invite    : l'administrateur invite un stagiaire -> lien d'activation à transmettre
//  - relink    : nouveau lien (mot de passe oublié, lien expiré)
//  - revoke    : retire l'accès d'un stagiaire
// L'authentification est vérifiée ici (jeton de session + rôle admin en base).
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE_URL = 'https://munkerdursun-arch.github.io/Blue/cdt/';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function config(key: string) {
  const { data } = await admin.from('app_config').select('value').eq('key', key).maybeSingle();
  return data?.value as string | undefined;
}
async function checkSetupCode(code: unknown) {
  if (typeof code !== 'string' || code.length < 8) return false;
  return (await sha256(code)) === (await config('setup_code_hash'));
}

// Lien d'activation : le site vérifie le jeton lui-même (aucune redirection Supabase nécessaire)
async function activationLink(email: string, fullName: string) {
  let res = await admin.auth.admin.generateLink({ type: 'invite', email, options: { data: { full_name: fullName } } });
  let type = 'invite';
  if (res.error) {
    // compte déjà existant : lien de réinitialisation du mot de passe
    res = await admin.auth.admin.generateLink({ type: 'recovery', email });
    type = 'recovery';
  }
  if (res.error || !res.data?.properties?.hashed_token) throw new Error(res.error?.message || 'lien impossible');
  return `${SITE_URL}#/activer?t=${encodeURIComponent(res.data.properties.hashed_token)}&type=${type}`;
}

const emailOk = (e: unknown): e is string => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 200;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'méthode non autorisée' }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'requête invalide' }, 400); }
  const action = body.action;

  try {
    // ---------- actions protégées par le code d'installation ----------
    if (action === 'bootstrap' || action === 'seed') {
      if (!(await checkSetupCode(body.code))) return json({ error: 'code invalide' }, 403);
      if (action === 'seed') {
        const sections = body.sections as { id: string; position: number; title: string; html: string }[];
        const data = body.data as Record<string, unknown>;
        if (!Array.isArray(sections) || typeof data !== 'object') return json({ error: 'contenu invalide' }, 400);
        const r1 = await admin.from('course_sections').upsert(sections);
        if (r1.error) throw r1.error;
        const r2 = await admin.from('course_data').upsert(Object.entries(data).map(([key, value]) => ({ key, value })));
        if (r2.error) throw r2.error;
        return json({ ok: true, sections: sections.length, data: Object.keys(data).length });
      }
      // bootstrap : (ré)active le compte administrateur et renvoie un lien à usage unique
      const adminEmail = (await config('admin_email'))!.toLowerCase();
      const fullName = String(body.full_name || 'Munker Dursun').slice(0, 120);
      await admin.from('invitations').upsert({ email: adminEmail, full_name: fullName, role: 'admin' });
      const { data: existing } = await admin.from('profiles').select('id').eq('email', adminEmail).maybeSingle();
      if (existing) await admin.from('profiles').update({ role: 'admin' }).eq('id', existing.id);
      return json({ link: await activationLink(adminEmail, fullName) });
    }

    // ---------- actions de l'administrateur connecté ----------
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: who, error: whoErr } = await admin.auth.getUser(token);
    if (whoErr || !who?.user) return json({ error: 'connexion requise' }, 401);
    const { data: me } = await admin.from('profiles').select('role').eq('id', who.user.id).maybeSingle();
    if (me?.role !== 'admin') return json({ error: "réservé à l'administrateur" }, 403);

    if (action === 'invite') {
      const email = String(body.email || '').trim().toLowerCase();
      const fullName = String(body.full_name || '').trim().slice(0, 120);
      if (!emailOk(email) || fullName.length < 2) return json({ error: 'nom ou e-mail invalide' }, 400);
      const { error } = await admin.from('invitations').upsert({ email, full_name: fullName, role: 'trainee' });
      if (error) throw error;
      return json({ link: await activationLink(email, fullName), email, full_name: fullName });
    }
    if (action === 'relink') {
      const email = String(body.email || '').trim().toLowerCase();
      const { data: inv } = await admin.from('invitations').select('full_name').eq('email', email).maybeSingle();
      if (!inv) return json({ error: 'invitation introuvable' }, 404);
      return json({ link: await activationLink(email, inv.full_name) });
    }
    if (action === 'revoke') {
      const email = String(body.email || '').trim().toLowerCase();
      if (email === (await config('admin_email'))?.toLowerCase()) return json({ error: "impossible de retirer l'administrateur" }, 400);
      const { data: p } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
      if (p) { const d = await admin.auth.admin.deleteUser(p.id); if (d.error) throw d.error; }
      await admin.from('invitations').delete().eq('email', email);
      return json({ ok: true });
    }
    return json({ error: 'action inconnue' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || 'erreur serveur' }, 500);
  }
});
