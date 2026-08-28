package com.vaultivo.exception;

public class StorageQuotaExceededException extends RuntimeException {
    public StorageQuotaExceededException() {
        super("This upload would exceed your storage quota");
    }
}
