-- Tracks the two-phase upload flow (init-upload -> complete-upload) so
-- abandoned uploads (client got a presigned URL but never confirmed, or the
-- S3 PUT itself failed) are visible to admins instead of vanishing without
-- a trace. A row here does NOT mean a file exists yet — see FileService.

CREATE TABLE upload_attempts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    size_bytes   BIGINT NOT NULL,
    storage_key  TEXT NOT NULL UNIQUE,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_upload_attempts_status_created ON upload_attempts (status, created_at);
