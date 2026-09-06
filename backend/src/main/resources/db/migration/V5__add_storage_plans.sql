-- Plans are a labeled quota tier. storageQuotaBytes on users remains the
-- actual value enforced by upload/quota checks (see FileService) — assigning
-- a plan just SETS that field to the plan's quota as a side effect, so an
-- admin can still grant a custom override afterward without touching plans
-- at all. This avoids restructuring existing, already-correct quota
-- enforcement logic for a purely organizational/billing-label concept.

CREATE TABLE plans (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    quota_bytes BIGINT NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0, -- monthly price in cents; 0 = free
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plans (name, quota_bytes, price_cents) VALUES
    ('Free', 5368709120, 0),      -- 5 GB — matches the existing default quota
    ('Pro',  53687091200, 999);   -- 50 GB, $9.99/mo

ALTER TABLE users ADD COLUMN plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

-- Backfill every existing account onto Free so no user is ever plan-less.
UPDATE users SET plan_id = (SELECT id FROM plans WHERE name = 'Free') WHERE plan_id IS NULL;
