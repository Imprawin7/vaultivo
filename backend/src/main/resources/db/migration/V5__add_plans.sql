-- Plans define a named quota tier (Free/Pro/etc). A user's plan_id records
-- WHICH plan they're on; their actual enforced storage_quota_bytes (added
-- in V1) stays the real source of truth for enforcement, copied from the
-- plan at assignment time. This lets an admin still grant a one-off custom
-- quota via the existing quota editor without a plan silently overwriting
-- it on the next unrelated update.

CREATE TABLE plans (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    quota_bytes BIGINT NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0, -- 0 = free
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exactly one default plan is assumed by AuthService on registration —
-- enforced at the application level, not by a DB constraint (a partial
-- unique index on is_default would be the DB-level equivalent, skipped
-- here to keep the migration simple for an MVP).
INSERT INTO plans (name, quota_bytes, price_cents, is_default) VALUES
    ('Free', 5368709120, 0, TRUE),        -- 5 GB
    ('Pro',  107374182400, 999, FALSE);   -- 100 GB, $9.99/mo

ALTER TABLE users ADD COLUMN plan_id UUID REFERENCES plans(id);

-- Backfill every existing account onto the default plan, keeping their
-- current storage_quota_bytes untouched (don't silently change anyone's
-- existing quota just because plans now exist).
UPDATE users SET plan_id = (SELECT id FROM plans WHERE is_default = TRUE LIMIT 1) WHERE plan_id IS NULL;

ALTER TABLE users ALTER COLUMN plan_id SET NOT NULL;
