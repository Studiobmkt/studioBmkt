import { readFile } from 'node:fs/promises';
import pg from 'pg';

const importPath = process.env.SUPABASE_IMPORT_FILE;
const connectionString = process.env.SUPABASE_DB_URL;

if (!importPath || !connectionString) {
  throw new Error('Defina SUPABASE_IMPORT_FILE e SUPABASE_DB_URL.');
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  await client.query(await readFile(importPath, 'utf8'));
  const { rows } = await client.query(`
    select 'brands' as name, count(*)::int as count from public.brands
    union all select 'services', count(*)::int from public.services
    union all select 'projects', count(*)::int from public.projects
    union all select 'posts', count(*)::int from public.posts
    union all select 'proposals', count(*)::int from public.proposals
    union all select 'legacy_users', count(*)::int from public.legacy_users
    order by name;
  `);
  console.log(JSON.stringify(rows));
} finally {
  await client.end();
}
