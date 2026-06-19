-- Grant usage on private schema to authenticated users.
-- This allows public security invoker wrappers to execute functions in the private schema.

grant usage on schema private to authenticated;
