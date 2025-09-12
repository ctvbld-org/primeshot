-- Drop legacy upload_sessions table now that uploads use direct S3 presigned flow
-- Irreversible migration: data will be removed

begin;

-- Drop dependent objects automatically
drop table if exists upload_sessions cascade;

commit;


