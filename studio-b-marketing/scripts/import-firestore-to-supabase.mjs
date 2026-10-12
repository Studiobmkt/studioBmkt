import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const inputPath = process.env.FIRESTORE_EXPORT_FILE;
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!inputPath || !url || !serviceKey) {
  throw new Error('Defina FIRESTORE_EXPORT_FILE, SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
}

const source = JSON.parse(await readFile(inputPath, 'utf8'));
const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const timestamp = (value) => value || null;
const report = {};

async function upsert(table, rows) {
  if (!rows.length) return 0;
  const { error } = await client.from(table).upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`${table}: ${error.message}`);
  return rows.length;
}

report.brands = await upsert('brands', (source.brands ?? []).map(({ id, name, logoUrl, url, status, order }) => ({
  id, name, logo_url: logoUrl ?? null, url: url ?? null, status: status ?? null, display_order: order ?? 0,
})));

report.services = await upsert('services', (source.services ?? []).map(({ id, title, description, highlights, isDark, iconName, status, order, imageUrl }) => ({
  id, title, description: description ?? null, highlights: highlights ?? [], is_dark: isDark ?? false,
  icon_name: iconName ?? null, status: status ?? null, display_order: order ?? 0, image_url: imageUrl ?? null,
})));

report.projects = await upsert('projects', (source.projects ?? []).map((row) => ({
  id: row.id, client: row.client ?? null, title: row.title, slug: row.slug, category: row.category ?? null,
  segment: row.segment ?? null, short_description: row.shortDescription ?? null,
  full_description: row.fullDescription ?? null, challenge: row.challenge ?? null, solution: row.solution ?? null,
  services: row.services ?? [], tags: row.tags ?? [], external_link: row.externalLink ?? null,
  results: row.results ?? null, status: row.status ?? null, highlight_home: row.highlightHome ?? false,
  display_order: row.order ?? 0, image_url: row.imageUrl ?? null, gallery: row.gallery ?? [],
  created_at: timestamp(row.createdAt), updated_at: timestamp(row.updatedAt),
})));

report.posts = await upsert('posts', (source.posts ?? []).map((row) => ({
  id: row.id, title: row.title, description: row.description ?? null, excerpt: row.description ?? null,
  content: row.content ?? null, slug: row.slug, tags: row.tags ?? [], published: row.published ?? false,
  published_at: timestamp(row.publishedAt), meta_title: row.metaTitle ?? null,
  meta_description: row.metaDescription ?? null, image_url: row.imageUrl ?? null,
  created_at: timestamp(row.createdAt), updated_at: timestamp(row.updatedAt),
})));

report.proposals = await upsert('proposals', (source.proposals ?? []).map((row) => ({
  id: row.id, name: row.name ?? null, company: row.company ?? null, email: row.email ?? null,
  phone: row.phone ?? null, whatsapp: row.whatsapp ?? null, segment: row.segment ?? null,
  services: row.services ?? [], message: row.message ?? null, source: row.source ?? null,
  status: row.status ?? null, created_at: timestamp(row.createdAt),
})));

const legacyUsers = (source.users ?? []).map((row) => ({
  firebase_id: row.id, firebase_uid: row.uid ?? null, email: row.email ?? null, payload: row,
}));
if (legacyUsers.length) {
  const { error } = await client.from('legacy_users').upsert(legacyUsers, { onConflict: 'firebase_id' });
  if (error) throw new Error(`legacy_users: ${error.message}`);
}
report.legacy_users = legacyUsers.length;

console.log(JSON.stringify(report));
