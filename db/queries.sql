-- =====================================================================
-- Common queries for the parent_id adjacency-list folder structure
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Get all descendant folder IDs of a given folder (recursive CTE)
--    Use this before: trashing a folder tree, computing total size,
--    or checking permission inheritance.
-- ---------------------------------------------------------------------
WITH RECURSIVE folder_tree AS (
    SELECT id, parent_id, name
    FROM folders
    WHERE id = :folder_id

    UNION ALL

    SELECT f.id, f.parent_id, f.name
    FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
)
SELECT id, name FROM folder_tree;


-- ---------------------------------------------------------------------
-- 2. Soft-delete a folder and everything inside it (folders + files)
--    Run inside a transaction.
-- ---------------------------------------------------------------------
WITH RECURSIVE folder_tree AS (
    SELECT id FROM folders WHERE id = :folder_id
    UNION ALL
    SELECT f.id FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
)
UPDATE folders
SET is_trashed = TRUE, trashed_at = now()
WHERE id IN (SELECT id FROM folder_tree);

-- Then trash all files whose folder_id is in that same tree:
WITH RECURSIVE folder_tree AS (
    SELECT id FROM folders WHERE id = :folder_id
    UNION ALL
    SELECT f.id FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
)
UPDATE files
SET is_trashed = TRUE, trashed_at = now()
WHERE folder_id IN (SELECT id FROM folder_tree);


-- ---------------------------------------------------------------------
-- 3. Breadcrumb path from a folder up to root (recursive CTE, reversed)
-- ---------------------------------------------------------------------
WITH RECURSIVE breadcrumb AS (
    SELECT id, parent_id, name, 0 AS depth
    FROM folders
    WHERE id = :folder_id

    UNION ALL

    SELECT f.id, f.parent_id, f.name, b.depth + 1
    FROM folders f
    INNER JOIN breadcrumb b ON f.id = b.parent_id
)
SELECT id, name FROM breadcrumb ORDER BY depth DESC;


-- ---------------------------------------------------------------------
-- 4. Prevent moving a folder into its own descendant (cycle check)
--    Call before UPDATE folders SET parent_id = :new_parent_id
--    WHERE id = :folder_id.  If this returns a row, reject the move.
-- ---------------------------------------------------------------------
WITH RECURSIVE folder_tree AS (
    SELECT id FROM folders WHERE id = :folder_id
    UNION ALL
    SELECT f.id FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
)
SELECT 1 FROM folder_tree WHERE id = :new_parent_id;


-- ---------------------------------------------------------------------
-- 5. List a user's accessible files/folders (owned + shared with them),
--    excluding trashed items — a typical "My Drive" query.
-- ---------------------------------------------------------------------
SELECT f.*
FROM files f
WHERE f.is_trashed = FALSE
  AND (
    f.owner_id = :user_id
    OR f.id IN (SELECT file_id FROM shares WHERE shared_with_id = :user_id AND file_id IS NOT NULL)
  )
ORDER BY f.updated_at DESC;
