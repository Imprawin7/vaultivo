package com.vaultivo.exception;

public class DuplicateNameException extends RuntimeException {
    public DuplicateNameException(String name) {
        super("An item named \"" + name + "\" already exists in this location");
    }
}
