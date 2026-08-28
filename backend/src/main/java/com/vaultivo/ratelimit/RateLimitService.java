package com.vaultivo.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * In-memory token-bucket rate limiter — one bucket per (key, limit type),
 * refilled once a minute. In-memory buckets reset on restart and don't
 * share state across multiple app instances; for a multi-instance
 * deployment this needs a shared backing store (Bucket4j supports Redis/
 * Hazelcast/JCache), but for a single-instance MVP this is sufficient.
 */
@Service
public class RateLimitService {

    public enum LimitType { API, PUBLIC_LINK }

    private final ConcurrentMap<String, Bucket> apiBuckets = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Bucket> publicLinkBuckets = new ConcurrentHashMap<>();

    private final int apiRequestsPerMinute;
    private final int publicLinkRequestsPerMinute;

    public RateLimitService(
            @Value("${app.rate-limit.api-requests-per-minute}") int apiRequestsPerMinute,
            @Value("${app.rate-limit.public-link-requests-per-minute}") int publicLinkRequestsPerMinute) {
        this.apiRequestsPerMinute = apiRequestsPerMinute;
        this.publicLinkRequestsPerMinute = publicLinkRequestsPerMinute;
    }

    public boolean tryConsume(String key, LimitType type) {
        Bucket bucket = switch (type) {
            case API -> apiBuckets.computeIfAbsent(key, k -> newBucket(apiRequestsPerMinute));
            case PUBLIC_LINK -> publicLinkBuckets.computeIfAbsent(key, k -> newBucket(publicLinkRequestsPerMinute));
        };
        return bucket.tryConsume(1);
    }

    private Bucket newBucket(int requestsPerMinute) {
        Bandwidth limit = Bandwidth.classic(requestsPerMinute, Refill.greedy(requestsPerMinute, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }
}
