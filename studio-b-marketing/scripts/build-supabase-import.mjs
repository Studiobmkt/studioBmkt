import { readFile, writeFile } from 'node:fs/promises';

const inputPath = process.env.FIRESTORE_EXPORT_FILE;
const outputPath = process.env.SUPABASE_IMPORT_FILE;

if (!inputPath || !outputPath) {
  throw new Error('Defina FIRESTORE_EXPORT_FILE e SUPABASE_IMPORT_FILE.');
}

const source = JSON.parse(await readFile(inputPath, 'utf8'));
const asJsonb = (rows) => `'${JSON.stringify(rows).replaceAll("'", "''")}'::jsonb`;

const statement = (sql) => `${sql.trim()}\n\n`;
let sql = 'begin;\n\n';

sql += statement(`
  alter table public.brands add column if not exists url text;
  alter table public.services add column if not exists highlights jsonb not null default '[]'::jsonb;
  alter table public.services add column if not exists is_dark boolean not null default false;
  alter table public.services add column if not exists icon_name text;
  alter table public.services add column if not exists status text;
  alter table public.posts add column if not exists description text;
  alter table public.posts add column if not exists excerpt text;
  alter table public.posts add column if not exists content text;
  alter table public.posts add column if not exists slug text;
  alter table public.posts add column if not exists tags text[] not null default '{}';
  alter table public.posts add column if not exists published boolean not null default false;
  alter table public.posts add column if not exists published_at timestamptz;
  alter table public.posts add column if not exists meta_title text;
  alter table public.posts add column if not exists meta_description text;
  alter table public.posts add column if not exists image_url text;
  alter table public.proposals add column if not exists name text;
  alter table public.proposals add column if not exists company text;
  alter table public.proposals add column if not exists email text;
  alter table public.proposals add column if not exists phone text;
  alter table public.proposals add column if not exists whatsapp text;
  alter table public.proposals add column if not exists segment text;
  alter table public.proposals add column if not exists services text[] not null default '{}';
  alter table public.proposals add column if not exists message text;
  alter table public.proposals add column if not exists source text;
  alter table public.proposals add column if not exists status text;
  create table if not exists public.legacy_users (
    firebase_id text primary key,
    firebase_uid text,
    email text,
    payload jsonb not null,
    imported_at timestamptz not null default now()
  );
`);

sql += statement(`
  insert into public.brands (id, name, logo_url, url, status, display_order)
  select id, name, "logoUrl", url, status, coalesce("order", 0)
  from jsonb_to_recordset(${asJsonb(source.brands ?? [])}) as row(id text, name text, "logoUrl" text, url text, status text, "order" integer)
  on conflict (id) do update set
    name = excluded.name, logo_url = excluded.logo_url, url = excluded.url,
    status = excluded.status, display_order = excluded.display_order;
`);

sql += statement(`
  insert into public.services (id, title, description, highlights, is_dark, icon_name, status, display_order, image_url)
  select id, title, description, coalesce(highlights, '[]'::jsonb), coalesce("isDark", false), "iconName", status, coalesce("order", 0), "imageUrl"
  from jsonb_to_recordset(${asJsonb(source.services ?? [])}) as row(id text, title text, description text, highlights jsonb, "isDark" boolean, "iconName" text, status text, "order" integer, "imageUrl" text)
  on conflict (id) do update set
    title = excluded.title, description = excluded.description, highlights = excluded.highlights,
    is_dark = excluded.is_dark, icon_name = excluded.icon_name, status = excluded.status,
    display_order = excluded.display_order, image_url = excluded.image_url;
`);

sql += statement(`
  insert into public.projects (id, client, title, slug, category, segment, short_description, full_description, challenge, solution, services, tags, external_link, results, status, highlight_home, display_order, image_url, gallery, created_at, updated_at)
  select id, client, title, slug, category, segment, "shortDescription", "fullDescription", challenge, solution,
    coalesce(services, '{}'), coalesce(tags, '{}'), "externalLink", results, status, coalesce("highlightHome", false),
    coalesce("order", 0), "imageUrl", coalesce(gallery, '{}'), nullif("createdAt", '')::timestamptz, nullif("updatedAt", '')::timestamptz
  from jsonb_to_recordset(${asJsonb(source.projects ?? [])}) as row(id text, client text, title text, slug text, category text, segment text, "shortDescription" text, "fullDescription" text, challenge text, solution text, services text[], tags text[], "externalLink" text, results text, status text, "highlightHome" boolean, "order" integer, "imageUrl" text, gallery text[], "createdAt" text, "updatedAt" text)
  on conflict (id) do update set
    client = excluded.client, title = excluded.title, slug = excluded.slug, category = excluded.category,
    segment = excluded.segment, short_description = excluded.short_description,
    full_description = excluded.full_description, challenge = excluded.challenge, solution = excluded.solution,
    services = excluded.services, tags = excluded.tags, external_link = excluded.external_link,
    results = excluded.results, status = excluded.status, highlight_home = excluded.highlight_home,
    display_order = excluded.display_order, image_url = excluded.image_url, gallery = excluded.gallery,
    updated_at = excluded.updated_at;
`);

sql += statement(`
  insert into public.posts (id, title, description, excerpt, content, slug, tags, published, published_at, meta_title, meta_description, image_url, created_at, updated_at)
  select id, title, description, description, content, slug, coalesce(tags, '{}'), coalesce(published, false),
    nullif("publishedAt", '')::timestamptz, "metaTitle", "metaDescription", "imageUrl",
    nullif("createdAt", '')::timestamptz, nullif("updatedAt", '')::timestamptz
  from jsonb_to_recordset(${asJsonb(source.posts ?? [])}) as row(id text, title text, description text, content text, slug text, tags text[], published boolean, "publishedAt" text, "metaTitle" text, "metaDescription" text, "imageUrl" text, "createdAt" text, "updatedAt" text)
  on conflict (id) do update set
    title = excluded.title, description = excluded.description, excerpt = excluded.excerpt, content = excluded.content,
    slug = excluded.slug, tags = excluded.tags, published = excluded.published, published_at = excluded.published_at,
    meta_title = excluded.meta_title, meta_description = excluded.meta_description, image_url = excluded.image_url,
    updated_at = excluded.updated_at;
`);

sql += statement(`
  insert into public.proposals (id, name, company, email, phone, whatsapp, segment, services, message, source, status, created_at)
  select id, name, company, email, phone, whatsapp, segment, coalesce(services, '{}'), message, source, status,
    nullif("createdAt", '')::timestamptz
  from jsonb_to_recordset(${asJsonb(source.proposals ?? [])}) as row(id text, name text, company text, email text, phone text, whatsapp text, segment text, services text[], message text, source text, status text, "createdAt" text)
  on conflict (id) do update set
    name = excluded.name, company = excluded.company, email = excluded.email, phone = excluded.phone,
    whatsapp = excluded.whatsapp, segment = excluded.segment, services = excluded.services,
    message = excluded.message, source = excluded.source, status = excluded.status;
`);

sql += statement(`
  insert into public.legacy_users (firebase_id, firebase_uid, email, payload)
  select id, uid, email, to_jsonb(row)
  from jsonb_to_recordset(${asJsonb(source.users ?? [])}) as row(id text, uid text, email text, "firstName" text, "lastName" text, "agencyRole" text, "siteRole" text, "birthDate" text, permissions text, "photoURL" text, "displayName" text, role text, "createdAt" text, "accessStatus" text, "updatedAt" text)
  on conflict (firebase_id) do update set firebase_uid = excluded.firebase_uid, email = excluded.email, payload = excluded.payload, imported_at = now();
`);

sql += 'commit;\n';
await writeFile(outputPath, sql, { encoding: 'utf8', mode: 0o600 });
console.log(JSON.stringify({ outputPath, bytes: Buffer.byteLength(sql) }));
