package com.vaultivo.activity;

/** Short action codes stored in activities.action — kept as plain constants
 *  rather than a JPA enum so new codes never require a migration. */
public final class ActivityAction {
    private ActivityAction() {}

    public static final String LOGIN = "LOGIN";
    public static final String LOGOUT = "LOGOUT";
    public static final String REGISTER = "REGISTER";

    public static final String UPLOAD_FILE = "UPLOAD_FILE";
    public static final String DOWNLOAD_FILE = "DOWNLOAD_FILE";
    public static final String RENAME_FILE = "RENAME_FILE";
    public static final String MOVE_FILE = "MOVE_FILE";
    public static final String STAR_FILE = "STAR_FILE";
    public static final String UNSTAR_FILE = "UNSTAR_FILE";
    public static final String TRASH_FILE = "TRASH_FILE";
    public static final String RESTORE_FILE = "RESTORE_FILE";
    public static final String DELETE_FILE_PERMANENT = "DELETE_FILE_PERMANENT";
    public static final String UPLOAD_FILE_VERSION = "UPLOAD_FILE_VERSION";
    public static final String RESTORE_FILE_VERSION = "RESTORE_FILE_VERSION";

    public static final String CREATE_FOLDER = "CREATE_FOLDER";
    public static final String RENAME_FOLDER = "RENAME_FOLDER";
    public static final String MOVE_FOLDER = "MOVE_FOLDER";
    public static final String TRASH_FOLDER = "TRASH_FOLDER";
    public static final String RESTORE_FOLDER = "RESTORE_FOLDER";
    public static final String DELETE_FOLDER_PERMANENT = "DELETE_FOLDER_PERMANENT";

    public static final String SHARE_FILE = "SHARE_FILE";
    public static final String SHARE_FOLDER = "SHARE_FOLDER";
    public static final String REVOKE_SHARE = "REVOKE_SHARE";
    public static final String CREATE_PUBLIC_LINK = "CREATE_PUBLIC_LINK";

    public static final String ADMIN_SUSPEND_USER = "ADMIN_SUSPEND_USER";
    public static final String ADMIN_REACTIVATE_USER = "ADMIN_REACTIVATE_USER";
    public static final String ADMIN_CHANGE_QUOTA = "ADMIN_CHANGE_QUOTA";
    public static final String ADMIN_GRANT_ADMIN = "ADMIN_GRANT_ADMIN";
    public static final String ADMIN_REVOKE_ADMIN = "ADMIN_REVOKE_ADMIN";
    public static final String ADMIN_DELETE_ACCOUNT = "ADMIN_DELETE_ACCOUNT";
}
