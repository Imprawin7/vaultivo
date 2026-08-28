package com.vaultivo.exception;

public class LinkExpiredException extends RuntimeException {
    public LinkExpiredException() {
        super("This share link has expired or been revoked");
    }
}
