-- =====================================================================
-- Cloud-Based File Storage Service — PostgreSQL Schema
-- =====================================================================
-- Notes:
-- - Nested folders use a parent_id adjacency list (simple, MVP-friendly).
--   Subtree queries (e.g. "delete folder + all descendants") use a
--   recursive CTE (see queries.sql). If subtree ops become a bottleneck,
--   migrate to a materialized path or closure table later.
-- - Soft delete via `is_trashed` + `trashed_at` on folders and files.
-- - UUID primary keys throughout (avoids leaking sequential IDs, plays
--   well with S3 object keys).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255),           -- NULL if OAuth-only account
    display_name        VARCHAR(150) NOT NULL,
    avatar_url          TEXT,
    auth_provider       VARCHAR(20) NOT NULL DEFAULT 'LOCAL', -- LOCAL, GOOGLE
    provider_subject_id VARCHAR(255),           -- OAuth sub/id from provider
    storage_quota_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5 GB default
    storage_used_bytes  BIGINT NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_auth_provider CHECK (auth_provider IN ('LOCAL', 'GOOGLE')),
    CONSTRAINT chk_local_has_password
        CHECK (auth_provider <> 'LOCAL' OR password_hash IS NOT NULL)
);

CREATE UNIQUE INDEX idx_users_provider_subject
    ON users (auth_provider, provider_subject_id)
    WHERE provider_subject_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- folders  (self-referencing adjacency list)
-- ---------------------------------------------------------------------
CREATE TABLE folders (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id    UUID REFERENCES folders(id) ON DELETE CASCADE, -- NULL = root
    name         VARCHAR(255) NOT NULL,
    is_trashed   BOOLEAN NOT NULL DEFAULT FALSE,
    trashed_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- prevent duplicate folder names as direct siblings (only among live folders)
    CONSTRAINT uq_folder_sibling_name
        UNIQUE (owner_id, parent_id, name)
);

CREATE INDEX idx_folders_owner       ON folders (owner_id);
CREATE INDEX idx_folders_parent      ON folders (parent_id);
CREATE INDEX idx_folders_trashed     ON folders (owner_id, is_trashed);

-- ---------------------------------------------------------------------
-- files  (metadata only — bytes live in S3 / Supabase Storage)
-- ---------------------------------------------------------------------
CREATE TABLE files (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id         UUID REFERENCES folders(id) ON DELETE CASCADE, -- NULL = root
    name              VARCHAR(255) NOT NULL,
    mime_type         VARCHAR(150) NOT NULL,
    size_bytes        BIGINT NOT NULL,
    storage_key       TEXT NOT NULL,            -- S3 object key for current version
    current_version   INTEGER NOT NULL DEFAULT 1,
    checksum_sha256    VARCHAR(64),
    is_starred        BOOLEAN NOT NULL DEFAULT FALSE,
    is_trashed        BOOLEAN NOT NULL DEFAULT FALSE,
    trashed_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_file_sibling_name
        UNIQUE (owner_id, folder_id, name)
);

CREATE INDEX idx_files_owner      ON files (owner_id);
CREATE INDEX idx_files_folder     ON files (folder_id);
CREATE INDEX idx_files_trashed    ON files (owner_id, is_trashed);
CREATE INDEX idx_files_starred    ON files (owner_id, is_starred) WHERE is_starred = TRUE;
-- Full-text search on file name (extend to a tsvector column if search grows)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE INDEX idx_files_name_trgm  ON files USING gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------
-- file_versions  (Phase 2, modeled now to avoid a later migration)
-- ---------------------------------------------------------------------
CREATE TABLE file_versions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id       UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_key   TEXT NOT NULL,
    size_bytes    BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64),
    uploaded_by   UUID NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_file_version UNIQUE (file_id, version_number)
);

CREATE INDEX idx_file_versions_file ON file_versions (file_id);

-- ---------------------------------------------------------------------
-- shares  (direct user-to-user sharing, file OR folder — exactly one)
-- ---------------------------------------------------------------------
CREATE TABLE shares (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id        UUID REFERENCES files(id) ON DELETE CASCADE,
    folder_id      UUID REFERENCES folders(id) ON DELETE CASCADE,
    shared_with_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_by_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role           VARCHAR(10) NOT NULL,  -- VIEWER, EDITOR
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_share_role CHECK (role IN ('VIEWER', 'EDITOR')),
    CONSTRAINT chk_share_target CHECK (
        (file_id IS NOT NULL AND folder_id IS NULL) OR
        (file_id IS NULL AND folder_id IS NOT NULL)
    ),
    CONSTRAINT uq_share_file   UNIQUE (file_id, shared_with_id),
    CONSTRAINT uq_share_folder UNIQUE (folder_id, shared_with_id)
);

CREATE INDEX idx_shares_shared_with ON shares (shared_with_id);
CREATE INDEX idx_shares_file        ON shares (file_id);
CREATE INDEX idx_shares_folder      ON shares (folder_id);

-- ---------------------------------------------------------------------
-- link_shares  (public share links, file OR folder — exactly one)
-- ---------------------------------------------------------------------
CREATE TABLE link_shares (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id        UUID REFERENCES files(id) ON DELETE CASCADE,
    folder_id      UUID REFERENCES folders(id) ON DELETE CASCADE,
    token          VARCHAR(64) NOT NULL UNIQUE,   -- opaque random token for the URL
    role           VARCHAR(10) NOT NULL DEFAULT 'VIEWER',
    password_hash  VARCHAR(255),                  -- NULL = no password
    expires_at     TIMESTAMPTZ,                   -- NULL = never expires
    created_by_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revoked_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_link_role CHECK (role IN ('VIEWER', 'EDITOR')),
    CONSTRAINT chk_link_target CHECK (
        (file_id IS NOT NULL AND folder_id IS NULL) OR
        (file_id IS NULL AND folder_id IS NOT NULL)
    )
);

CREATE INDEX idx_link_shares_token  ON link_shares (token);
CREATE INDEX idx_link_shares_file   ON link_shares (file_id);
CREATE INDEX idx_link_shares_folder ON link_shares (folder_id);

-- ---------------------------------------------------------------------
-- stars  (many-to-many, but files.is_starred is enough for MVP —
--          this table is here in case folders/multi-device sync need it)
-- ---------------------------------------------------------------------
CREATE TABLE stars (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id    UUID REFERENCES files(id) ON DELETE CASCADE,
    folder_id  UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_star_target CHECK (
        (file_id IS NOT NULL AND folder_id IS NULL) OR
        (file_id IS NULL AND folder_id IS NOT NULL)
    ),
    CONSTRAINT uq_star_file   UNIQUE (user_id, file_id),
    CONSTRAINT uq_star_folder UNIQUE (user_id, folder_id)
);

CREATE INDEX idx_stars_user ON stars (user_id);

-- ---------------------------------------------------------------------
-- activities  (audit log — Phase 2, modeled now)
-- ---------------------------------------------------------------------
CREATE TABLE activities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action      VARCHAR(30) NOT NULL,  -- UPLOAD, DELETE, RESTORE, SHARE, RENAME, MOVE, DOWNLOAD...
    file_id     UUID REFERENCES files(id) ON DELETE SET NULL,
    folder_id   UUID REFERENCES folders(id) ON DELETE SET NULL,
    metadata    JSONB,                 -- flexible extra context (old name, target folder, etc.)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_actor      ON activities (actor_id, created_at DESC);
CREATE INDEX idx_activities_file       ON activities (file_id);
CREATE INDEX idx_activities_folder     ON activities (folder_id);

-- ---------------------------------------------------------------------
-- updated_at auto-touch trigger (applied to tables that have the column)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
