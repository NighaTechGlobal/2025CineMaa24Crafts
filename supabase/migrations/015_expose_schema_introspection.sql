-- Expose public schema metadata via views for PostgREST introspection
-- This enables automated verification of table structures from CI/automation.

begin;

-- List public tables
create or replace view public.schema_tables as
select
  t.table_name,
  t.table_type
from information_schema.tables t
where t.table_schema = 'public'
  and t.table_type in ('BASE TABLE','VIEW');

-- Column metadata for public tables
create or replace view public.schema_columns as
select
  c.table_name,
  c.column_name,
  c.data_type,
  (c.is_nullable = 'NO') as not_null,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public';

-- Constraint overview (PK/UNIQUE) for public tables
create or replace view public.schema_constraints as
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as columns
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
 and tc.table_name = kcu.table_name
where tc.table_schema = 'public'
  and tc.constraint_type in ('PRIMARY KEY','UNIQUE')
group by tc.table_name, tc.constraint_name, tc.constraint_type;

commit;