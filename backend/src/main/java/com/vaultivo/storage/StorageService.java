package com.vaultivo.storage;

import java.util.UUID;

/**
 * Abstraction over the object storage backend (S3 today; a Supabase Storage
 * implementation can be swapped in later since callers only see this
 * interface — see app.storage.provider in application.yml).
 */
public interface StorageService {

    /**
     * Builds a unique, namespaced object key for a new upload. Does not
     * touch storage or the DB — pure key generation.
     */
    String generateObjectKey(UUID ownerId, String originalFilename);

    /**
     * A short-lived PUT URL the client uploads bytes to directly, bypassing
     * our API server for the file payload itself.
     */
    PresignedUpload createPresignedUploadUrl(String objectKey, String mimeType, long sizeBytes);

    /**
     * A short-lived GET URL for downloading. {@code downloadFilename} sets
     * Content-Disposition so the browser saves it under the file's real name
     * rather than the opaque storage key.
     */
    PresignedDownload createPresignedDownloadUrl(String objectKey, String downloadFilename);

    /**
     * Same as createPresignedDownloadUrl, but Content-Disposition is set to
     * "inline" instead of "attachment" — the browser renders the content
     * directly (images, PDFs) rather than force-downloading it. Callers
     * decide when this is appropriate (image/PDF mime types); this method
     * doesn't validate content type itself.
     */
    PresignedDownload createPresignedPreviewUrl(String objectKey, String filename);

    void deleteObject(String objectKey);
}
