// Single source of truth for which mime types get a "Preview" option instead
// of just "Download" — used by both the authenticated item menu and the
// public-link viewer, so the two never drift out of sync.
export function isPreviewable(mimeType) {
  if (!mimeType) return false;
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}
