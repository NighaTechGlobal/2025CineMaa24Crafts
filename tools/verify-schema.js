/*
  Schema verification script
  - Fetches Supabase schema via PostgREST views: schema_tables, schema_columns, schema_constraints
  - Scans repository code for table usages and column references
  - Compares and generates a Markdown report
  - Exits non-zero if discrepancies are found
*/

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_REST_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Allow fallback to local migration parsing when env vars are missing
const hasApiCreds = !!(SUPABASE_URL && SUPABASE_KEY);

async function fetchJson(endpoint) {
  const url = SUPABASE_URL.replace(/\/$/, '') + endpoint;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse JSON from ${endpoint}: ${text}`);
  }
}

function walkFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  const results = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, build, dist
        if (/node_modules|dist|build|\.temp/.test(full)) continue;
        stack.push(full);
      } else {
        if (exts.includes(path.extname(entry.name))) {
          results.push(full);
        }
      }
    }
  }
  return results;
}

function extractTableUsages(fileContent) {
  const usages = [];
  const fromRegex = /\bfrom\(["'`]([a-zA-Z0-9_]+)["'`]\)/g;
  let m;
  while ((m = fromRegex.exec(fileContent)) !== null) {
    const table = m[1];
    // Slice a window around the match for local column extraction
    const start = Math.max(0, m.index - 1000);
    const end = Math.min(fileContent.length, m.index + 3000);
    const window = fileContent.slice(start, end);

    const columns = new Set();
    // .insert({ ... }) / .update({ ... }) keys
    const objectRegex = /\.(?:insert|update)\(\{([\s\S]*?)\}\)/g;
    let om;
    while ((om = objectRegex.exec(window)) !== null) {
      const obj = om[1];
      const keyRegex = /\b([a-zA-Z0-9_]+)\s*:/g;
      let km;
      while ((km = keyRegex.exec(obj)) !== null) {
        columns.add(km[1]);
      }
    }
    // .select('col1, col2, col3')
    const selectRegex = /\.select\(["'`]([^"'`]+)["'`]\)/g;
    let sm;
    while ((sm = selectRegex.exec(window)) !== null) {
      const list = sm[1];
      if (list.trim() === '*') continue;
      list.split(',').map(s => s.trim()).forEach(col => {
        if (col) columns.add(col);
      });
    }
    usages.push({ table, columns: Array.from(columns) });
  }
  return usages;
}

function buildCodeModel(rootDir) {
  const searchDirs = [
    path.join(rootDir, 'backend-nest', 'src'),
    path.join(rootDir, 'mobile-app', 'src'),
  ];
  const model = new Map(); // table -> { files: Set<string>, columns: Set<string> }
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = walkFiles(dir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const usages = extractTableUsages(content);
      for (const u of usages) {
        if (!model.has(u.table)) {
          model.set(u.table, { files: new Set(), columns: new Set() });
        }
        const entry = model.get(u.table);
        entry.files.add(path.relative(rootDir, file));
        for (const col of u.columns) entry.columns.add(col);
      }
    }
  }
  // Convert Sets to arrays for reporting
  const out = {};
  for (const [table, { files, columns }] of model.entries()) {
    out[table] = { files: Array.from(files), columns: Array.from(columns) };
  }
  return out;
}

function compareModels(dbSchema, codeModel) {
  const report = { matches: [], diffs: [], missingTables: [], extraTables: [] };
  const dbTables = new Set(Object.keys(dbSchema));
  const codeTables = new Set(Object.keys(codeModel));

  // Tables present in code but not in DB
  for (const t of codeTables) {
    if (!dbTables.has(t)) report.missingTables.push(t);
  }
  // Tables present in DB but not referenced in code
  for (const t of dbTables) {
    if (!codeTables.has(t)) report.extraTables.push(t);
  }

  for (const t of codeTables) {
    if (!dbTables.has(t)) continue;
    const dbCols = new Set(dbSchema[t].columns.map(c => c.column_name));
    const dbTypes = Object.fromEntries(dbSchema[t].columns.map(c => [c.column_name, c.data_type]));
    const codeCols = new Set(codeModel[t].columns);

    const missingCols = Array.from(codeCols).filter(c => !dbCols.has(c));
    const unusedCols = Array.from(dbCols).filter(c => !codeCols.has(c));
    // Type mismatches are difficult to infer from code; we only report DB types here
    const mismatchedTypes = []; // Placeholder for future enhancements

    if (missingCols.length === 0 && mismatchedTypes.length === 0) {
      report.matches.push(t);
    } else {
      report.diffs.push({
        table: t,
        files: codeModel[t].files,
        missingColumnsInDB: missingCols,
        unusedColumnsInCode: unusedCols,
        dbTypes,
      });
    }
  }
  return report;
}

function renderReport(report, dbSchema, codeModel) {
  const lines = [];
  lines.push('# Schema Verification Report');
  const now = new Date().toISOString();
  lines.push(`Generated at: ${now}`);

  lines.push('\n## Tables (DB)');
  for (const t of Object.keys(dbSchema).sort()) {
    lines.push(`- ${t}`);
  }

  lines.push('\n## Tables (Code References)');
  for (const t of Object.keys(codeModel).sort()) {
    lines.push(`- ${t}`);
  }

  lines.push('\n## Matches');
  if (report.matches.length) {
    for (const t of report.matches.sort()) lines.push(`- ${t}`);
  } else {
    lines.push('- None');
  }

  lines.push('\n## Differences');
  if (report.diffs.length) {
    for (const d of report.diffs) {
      lines.push(`- ${d.table}`);
      lines.push(`  - Files: ${d.files.join(', ')}`);
      if (d.missingColumnsInDB.length)
        lines.push(`  - Columns used in code missing in DB: ${d.missingColumnsInDB.join(', ')}`);
      if (d.unusedColumnsInCode.length)
        lines.push(`  - Columns in DB not referenced in code: ${d.unusedColumnsInCode.join(', ')}`);
      lines.push(`  - DB types: ${Object.entries(d.dbTypes).map(([k,v])=>`${k}:${v}`).join(', ')}`);
    }
  } else {
    lines.push('- None');
  }

  lines.push('\n## Missing Tables (Code references not found in DB)');
  if (report.missingTables.length) {
    for (const t of report.missingTables.sort()) lines.push(`- ${t}`);
  } else {
    lines.push('- None');
  }

  lines.push('\n## Extra Tables (DB tables not referenced in code)');
  if (report.extraTables.length) {
    for (const t of report.extraTables.sort()) lines.push(`- ${t}`);
  } else {
    lines.push('- None');
  }

  return lines.join('\n');
}

function parseLocalMigrations(rootDir) {
  const migDir = path.join(rootDir, 'supabase', 'migrations');
  const files = fs.existsSync(migDir) ? fs.readdirSync(migDir).filter(f => f.endsWith('.sql')) : [];
  const sql = files.map(f => fs.readFileSync(path.join(migDir, f), 'utf8')).join('\n\n');

  // Extract CREATE TABLE blocks
  const tableRegex = /create\s+table\s+public\.([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
  const dbSchema = {};
  let tm;
  while ((tm = tableRegex.exec(sql)) !== null) {
    const table = tm[1];
    const body = tm[2];
    dbSchema[table] = { columns: [], constraints: [] };
    // Split by commas but respect parentheses (simple heuristic)
    const parts = body.split(/,(?![^()]*\))/);
    for (let raw of parts) {
      const line = raw.trim().replace(/\s+/g, ' ');
      if (!line) continue;
      // Constraint line
      if (/^(primary key|unique|constraint)/i.test(line)) {
        let ctype = 'CONSTRAINT';
        if (/primary key/i.test(line)) ctype = 'PRIMARY KEY';
        else if (/unique/i.test(line)) ctype = 'UNIQUE';
        // Extract columns within parentheses
        const colsMatch = line.match(/\(([^)]+)\)/);
        const cols = colsMatch ? colsMatch[1].split(',').map(s => s.trim()) : [];
        dbSchema[table].constraints.push({ constraint_name: null, constraint_type: ctype, columns: cols.join(', ') });
        continue;
      }
      // Column definition: name type [constraints]
      const m = line.match(/^([a-zA-Z0-9_]+)\s+([^\s,()]+)([\s\S]*)$/);
      if (m) {
        const col = m[1];
        const dtype = m[2];
        const rest = m[3] || '';
        const notNull = /not null/i.test(rest);
        const defMatch = rest.match(/default\s+([^\s,]+)/i);
        dbSchema[table].columns.push({
          column_name: col,
          data_type: dtype,
          not_null: notNull,
          column_default: defMatch ? defMatch[1] : null,
        });
      }
    }
  }
  return dbSchema;
}

async function main() {
  let dbSchema;
  if (hasApiCreds) {
    try {
      const schemaTables = await fetchJson('/schema_tables');
      const schemaColumns = await fetchJson('/schema_columns');
      const schemaConstraints = await fetchJson('/schema_constraints');
      dbSchema = {};
      for (const row of schemaTables) {
        dbSchema[row.table_name] = { columns: [], constraints: [] };
      }
      for (const col of schemaColumns) {
        if (!dbSchema[col.table_name]) continue;
        dbSchema[col.table_name].columns.push({
          column_name: col.column_name,
          data_type: col.data_type,
          not_null: !!col.not_null,
          column_default: col.column_default || null,
        });
      }
      for (const c of schemaConstraints) {
        if (!dbSchema[c.table_name]) continue;
        dbSchema[c.table_name].constraints.push({
          constraint_name: c.constraint_name,
          constraint_type: c.constraint_type,
          columns: c.columns,
        });
      }
    } catch (err) {
      console.warn('Warning: Failed to fetch schema via API views. Falling back to local migration parsing.');
      const rootDir = path.resolve(__dirname, '..');
      dbSchema = parseLocalMigrations(rootDir);
    }
  } else {
    const rootDir = path.resolve(__dirname, '..');
    dbSchema = parseLocalMigrations(rootDir);
  }

  // Build code model
  const rootDir = path.resolve(__dirname, '..');
  const codeModel = buildCodeModel(rootDir);

  // Compare and render report
  const comparison = compareModels(dbSchema, codeModel);
  const output = renderReport(comparison, dbSchema, codeModel);
  const outPath = path.join(rootDir, 'schema-report.md');
  fs.writeFileSync(outPath, output, 'utf8');

  console.log(`Schema report written to ${outPath}`);
  const hasDiffs = comparison.diffs.length || comparison.missingTables.length;
  process.exit(hasDiffs ? 1 : 0);
}

// Node 18+ has global fetch
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});