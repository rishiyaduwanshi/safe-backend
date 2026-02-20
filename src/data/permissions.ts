/**
 * Moderator Permission Definitions
 *
 * Permissions follow the format:  resource:action
 * These are assigned to a moderator at creation time by an admin.
 * The `requirePermission(...)` middleware checks these at route level.
 */

// ─── Permission Enum ────────────────────────────────────────────────────────

export enum Permission {
    // Reports
    REPORT_VIEW = 'report:view',
    REPORT_APPROVE = 'report:approve',
    REPORT_REJECT = 'report:reject',

    // Violations
    VIOLATION_VIEW = 'violation:view',
    VIOLATION_CONFIRM = 'violation:confirm',
    VIOLATION_REJECT = 'violation:reject',

    // Users  (read-only — moderators cannot mutate user accounts)
    USER_VIEW = 'user:view',

    // Hardware sources
    HARDWARE_VIEW = 'hardware:view',
}

// ─── Permission Groups (presets for easy assignment) ────────────────────────

export const PermissionGroup = {
    /** Can only view everything — for trainee / auditor moderators */
    VIEWER: [
        Permission.REPORT_VIEW,
        Permission.VIOLATION_VIEW,
        Permission.USER_VIEW,
        Permission.HARDWARE_VIEW,
    ],

    /** Can review and action reports */
    REPORT_MODERATOR: [
        Permission.REPORT_VIEW,
        Permission.REPORT_APPROVE,
        Permission.REPORT_REJECT,
        Permission.USER_VIEW,
    ],

    /** Can review and action violations */
    VIOLATION_MODERATOR: [
        Permission.VIOLATION_VIEW,
        Permission.VIOLATION_CONFIRM,
        Permission.VIOLATION_REJECT,
        Permission.USER_VIEW,
        Permission.HARDWARE_VIEW,
    ],

    /** Full moderator — all permissions */
    FULL: Object.values(Permission),
} as const satisfies Record<string, Permission[]>;

export type PermissionGroupKey = keyof typeof PermissionGroup;
