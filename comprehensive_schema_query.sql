-- 1. List all tables in the public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- 2. List all columns and their types for each table
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public';

-- 3. List all policies for each table
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    p.polname AS policy_name,
    p.polcmd AS command_type,
    p.polqual AS using_expression,
    p.polwithcheck AS with_check_expression,
    r.rolname AS role_name
FROM
    pg_policy p
JOIN
    pg_class c ON c.oid = p.polrelid
JOIN
    pg_namespace n ON n.oid = c.relnamespace
JOIN
    pg_roles r ON r.oid = p.polroles[1]
WHERE
    n.nspname = 'public';

-- 4. List all storage buckets
SELECT id, name, public
FROM storage.buckets;

-- 5. List all storage policies (this is more complex as policies are tied to objects)
-- This query shows policies on the storage.objects table, which governs access to files.
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    p.polname AS policy_name,
    p.polcmd AS command_type,
    p.polqual AS using_expression,
    p.polwithcheck AS with_check_expression,
    r.rolname AS role_name
FROM
    pg_policy p
JOIN
    pg_class c ON c.oid = p.polrelid
JOIN
    pg_namespace n ON n.oid = c.relnamespace
JOIN
    pg_roles r ON r.oid = p.polroles[1]
WHERE
    n.nspname = 'storage' AND c.relname = 'objects';