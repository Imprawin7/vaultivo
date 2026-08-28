package com.vaultivo.security;

/**
 * Ordered NONE < VIEWER < EDITOR < OWNER — enum ordinal is used directly for
 * "at least this level" comparisons via atLeast().
 */
public enum AccessLevel {
    NONE, VIEWER, EDITOR, OWNER;

    public boolean atLeast(AccessLevel required) {
        return this.ordinal() >= required.ordinal();
    }
}
