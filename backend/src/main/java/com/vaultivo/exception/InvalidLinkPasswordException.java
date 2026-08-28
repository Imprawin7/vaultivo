package com.vaultivo.exception;

public class InvalidLinkPasswordException extends RuntimeException {
    public InvalidLinkPasswordException() {
        super("Incorrect password for this share link");
    }
}
