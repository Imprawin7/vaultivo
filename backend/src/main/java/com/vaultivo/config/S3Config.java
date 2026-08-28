package com.vaultivo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${app.storage.s3.region}")
    private String region;

    // Empty = real AWS S3. Set to e.g. http://localhost:9000 to point at a
    // local MinIO instance for dev/testing — see docker-compose.yml. MinIO
    // (and most S3-compatible stores) requires path-style bucket addressing
    // instead of AWS's default virtual-hosted-style, hence pathStyleAccessEnabled below.
    @Value("${app.storage.s3.endpoint:}")
    private String endpointOverride;

    // Credentials are resolved via the AWS SDK's default provider chain
    // (env vars, ~/.aws/credentials, or an IAM instance/task role in
    // production) — never hardcode keys here. For MinIO locally, set
    // AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY to the MinIO root user/pass.
    @Bean
    public S3Client s3Client() {
        var builder = S3Client.builder().region(Region.of(region));
        if (usingCustomEndpoint()) {
            builder.endpointOverride(URI.create(endpointOverride))
                    .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        }
        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        var builder = S3Presigner.builder().region(Region.of(region));
        if (usingCustomEndpoint()) {
            builder.endpointOverride(URI.create(endpointOverride))
                    .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build());
        }
        return builder.build();
    }

    private boolean usingCustomEndpoint() {
        return endpointOverride != null && !endpointOverride.isBlank();
    }
}
