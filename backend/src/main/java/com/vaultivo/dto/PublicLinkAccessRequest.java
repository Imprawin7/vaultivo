package com.vaultivo.dto;

/** Body for accessing a password-protected public link. Empty/omit if no password set. */
public record PublicLinkAccessRequest(String password) {}
