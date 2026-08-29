-- Adds platform-admin capability. Admins are set manually via direct DB
-- access (no self-service "become admin" flow, by design) — see
-- LOCAL_SETUP.md / deployment docs for the promotion command.

ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;