package com.vaultivo.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucket;
    private final long presignExpiryMinutes;

    public S3StorageService(
            S3Client s3Client,
            S3Presigner s3Presigner,
            @Value("${app.storage.s3.bucket}") String bucket,
            @Value("${app.storage.s3.presigned-url-expiry-minutes}") long presignExpiryMinutes) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucket = bucket;
        this.presignExpiryMinutes = presignExpiryMinutes;
    }

    @Override
    public String generateObjectKey(UUID ownerId, String originalFilename) {
        String sanitized = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        // Namespacing by owner keeps per-user objects grouped and makes bulk
        // cleanup (e.g. account deletion) a simple prefix delete.
        return "%s/%s-%s".formatted(ownerId, UUID.randomUUID(), sanitized);
    }

    @Override
    public PresignedUpload createPresignedUploadUrl(String objectKey, String mimeType, long sizeBytes) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .contentType(mimeType)
                .contentLength(sizeBytes)
                .build();

        Duration expiry = Duration.ofMinutes(presignExpiryMinutes);

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(expiry)
                .putObjectRequest(putRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);

        return new PresignedUpload(objectKey, presigned.url().toString(), Instant.now().plus(expiry));
    }

    @Override
    public PresignedDownload createPresignedDownloadUrl(String objectKey, String downloadFilename) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .responseContentDisposition("attachment; filename=\"" + downloadFilename + "\"")
                .build();

        Duration expiry = Duration.ofMinutes(presignExpiryMinutes);

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(expiry)
                .getObjectRequest(getRequest)
                .build();

        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(presignRequest);

        return new PresignedDownload(presigned.url().toString(), Instant.now().plus(expiry));
    }

    @Override
    public void deleteObject(String objectKey) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build());
    }
}
