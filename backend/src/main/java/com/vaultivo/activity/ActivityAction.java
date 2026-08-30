package com.vaultivo.activity;

/** Short action codes stored in activities.action — kept as plain constants
 *  rather than a JPA enum so new codes never require a migration. */
public final class ActivityAction {
    private ActivityAction() {}

    public static final String LOGIN = "LOGIN";
    public static final String REGISTER = "REGISTER";

    public static final String ADMIN_SUSPEND_USER = "ADMIN_SUSPEND_USER";
    public static final String ADMIN_REACTIVATE_USER = "ADMIN_REACTIVATE_USER";
    public static final String ADMIN_CHANGE_QUOTA = "ADMIN_CHANGE_QUOTA";
    public static final String ADMIN_GRANT_ADMIN = "ADMIN_GRANT_ADMIN";
    public static final String ADMIN_REVOKE_ADMIN = "ADMIN_REVOKE_ADMIN";
    public static final String ADMIN_DELETE_ACCOUNT = "ADMIN_DELETE_ACCOUNT";
}
