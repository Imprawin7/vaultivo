-- Tags are per-user (a personal label vocabulary, like Gmail labels) — the
-- same tag name can exist independently for different users. Assigning a
-- tag doesn't require owning the tagged item, only VIEWER access — tagging
-- is the tagger's own personal annotation, not a mutation of the item's
-- real content, so collaborators can each maintain their own tags on a
-- shared file without needing edit rights.

CREATE TABLE tags (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(50) NOT NULL,
    color      VARCHAR(7), -- hex, e.g. #C6A15B — optional, null = default UI color
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_tag_owner_name UNIQUE (owner_id, name)
);

CREATE INDEX idx_tags_owner ON tags (owner_id);

-- Links a tag to EXACTLY ONE of file/folder — same mutually-exclusive
-- pattern as shares/link_shares in the V1 schema.
CREATE TABLE tag_assignments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id     UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    file_id    UUID REFERENCES files(id) ON DELETE CASCADE,
    folder_id  UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_tag_assignment_target CHECK (
        (file_id IS NOT NULL AND folder_id IS NULL) OR
        (file_id IS NULL AND folder_id IS NOT NULL)
    ),
    CONSTRAINT uq_tag_assignment_file   UNIQUE (tag_id, file_id),
    CONSTRAINT uq_tag_assignment_folder UNIQUE (tag_id, folder_id)
);

CREATE INDEX idx_tag_assignments_file   ON tag_assignments (file_id);
CREATE INDEX idx_tag_assignments_folder ON tag_assignments (folder_id);
CREATE INDEX idx_tag_assignments_tag    ON tag_assignments (tag_id);
