export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    FINANCE_ADMIN = 'FINANCE_ADMIN',
    OPS_ADMIN = 'OPS_ADMIN',
    SUPPORT = 'SUPPORT',
    DEVELOPER = 'DEVELOPER',
    USER = 'USER' // End-user (Parent)
}

export enum Action {
    // User Management
    CREATE_USER = 'create:user',
    VIEW_USER_PROFILE = 'view:user_profile',
    VIEW_CHILD_PROFILE = 'view:child_profile',
    EDIT_USER_INFO = 'edit:user_info',
    RESET_PASSWORD = 'reset:password',
    CHANGE_USER_EMAIL = 'change:user_email',
    CHANGE_ACCOUNT_STATUS = 'change:account_status',
    DELETE_USER_ACCOUNT = 'delete:user_account',

    // Financial
    VIEW_TRANSACTION_HISTORY = 'view:transaction_history',
    ISSUE_FULL_REFUND = 'issue:full_refund',
    ISSUE_PARTIAL_REFUND = 'issue:partial_refund',
    EXPORT_FINANCIAL_REPORTS = 'export:financial_reports',
    MODIFY_PAYMENT_METHODS = 'modify:payment_methods',

    // Credits
    VIEW_CREDIT_BALANCE = 'view:credit_balance',
    ADD_CREDITS_MANUALLY = 'add:credits_manually',
    REMOVE_CREDITS_MANUALLY = 'remove:credits_manually',
    COMP_PROMOTIONAL_CREDITS = 'comp:promotional_credits',
    VIEW_CREDIT_TRANSACTION_HISTORY = 'view:credit_transaction_history',

    // Adventure Entitlements
    VIEW_UNLOCKED_ADVENTURES = 'view:unlocked_adventures',
    MANUALLY_UNLOCK_ADVENTURES = 'unlock:adventures_manually',
    MANUALLY_REVOKE_UNLOCKS = 'revoke:unlocks_manually',
    BULK_UNLOCK_ADVENTURES = 'unlock:adventures_bulk',

    // Save Slots
    VIEW_TOTAL_SLOTS = 'view:total_slots',
    ADD_SLOTS_MANUALLY = 'add:slots_manually',
    REMOVE_SLOTS_MANUALLY = 'remove:slots_manually',
    DELETE_VERSION_OCCUPYING_SLOT = 'delete:version_occupying_slot',

    // Version Management
    VIEW_SAVED_VERSIONS = 'view:saved_versions',
    VIEW_VERSION_METADATA = 'view:version_metadata',
    DELETE_SAVED_VERSION = 'delete:saved_version',
    RESTORE_VERSION = 'restore:version',
    FORCE_DELETE_ORPHANED_ASSETS = 'delete:orphaned_assets',

    // Narration
    VIEW_NARRATION_STATUS = 'view:narration_status',
    MANUALLY_GRANT_NARRATION = 'grant:narration_manually',
    REMOVE_NARRATION = 'remove:narration',

    // Risk
    MARK_ACCOUNT_RISKY = 'mark:account_risky',
    SUSPEND_ACCOUNT = 'suspend:account',
    LIFT_SUSPENSION = 'lift:suspension'
}

// ----------------------------------------------------------------------
// THE SOURCE OF TRUTH - Derived from Permission Matrix.pdf
// ----------------------------------------------------------------------
const PERMISSION_MATRIX: Record<UserRole, Action[]> = {
    [UserRole.SUPER_ADMIN]: Object.values(Action), // Full Access

    [UserRole.FINANCE_ADMIN]: [
        Action.VIEW_USER_PROFILE, Action.VIEW_CHILD_PROFILE, Action.EDIT_USER_INFO, Action.RESET_PASSWORD, Action.CHANGE_USER_EMAIL, Action.CHANGE_ACCOUNT_STATUS, Action.DELETE_USER_ACCOUNT,
        Action.VIEW_TRANSACTION_HISTORY, Action.ISSUE_FULL_REFUND, Action.ISSUE_PARTIAL_REFUND, Action.EXPORT_FINANCIAL_REPORTS,
        Action.VIEW_CREDIT_BALANCE, Action.ADD_CREDITS_MANUALLY, Action.REMOVE_CREDITS_MANUALLY, Action.COMP_PROMOTIONAL_CREDITS, Action.VIEW_CREDIT_TRANSACTION_HISTORY,
        Action.VIEW_UNLOCKED_ADVENTURES, Action.MANUALLY_UNLOCK_ADVENTURES, Action.MANUALLY_REVOKE_UNLOCKS, Action.BULK_UNLOCK_ADVENTURES,
        Action.VIEW_TOTAL_SLOTS, Action.ADD_SLOTS_MANUALLY, Action.REMOVE_SLOTS_MANUALLY, Action.DELETE_VERSION_OCCUPYING_SLOT,
        Action.VIEW_SAVED_VERSIONS, Action.VIEW_VERSION_METADATA, Action.DELETE_SAVED_VERSION, Action.RESTORE_VERSION, Action.FORCE_DELETE_ORPHANED_ASSETS,
        Action.VIEW_NARRATION_STATUS, Action.MANUALLY_GRANT_NARRATION, Action.REMOVE_NARRATION,
        Action.MARK_ACCOUNT_RISKY, Action.SUSPEND_ACCOUNT, Action.LIFT_SUSPENSION
    ],

    [UserRole.OPS_ADMIN]: [
        Action.VIEW_USER_PROFILE, Action.VIEW_CHILD_PROFILE, Action.EDIT_USER_INFO, Action.RESET_PASSWORD, Action.CHANGE_USER_EMAIL, Action.CHANGE_ACCOUNT_STATUS, Action.DELETE_USER_ACCOUNT,
        Action.VIEW_TRANSACTION_HISTORY,
        Action.VIEW_CREDIT_BALANCE, Action.ADD_CREDITS_MANUALLY, Action.REMOVE_CREDITS_MANUALLY, Action.COMP_PROMOTIONAL_CREDITS, Action.VIEW_CREDIT_TRANSACTION_HISTORY,
        Action.VIEW_UNLOCKED_ADVENTURES, Action.MANUALLY_UNLOCK_ADVENTURES, Action.MANUALLY_REVOKE_UNLOCKS, Action.BULK_UNLOCK_ADVENTURES,
        Action.VIEW_TOTAL_SLOTS, Action.ADD_SLOTS_MANUALLY, Action.REMOVE_SLOTS_MANUALLY, Action.DELETE_VERSION_OCCUPYING_SLOT,
        Action.VIEW_SAVED_VERSIONS, Action.VIEW_VERSION_METADATA, Action.DELETE_SAVED_VERSION, Action.RESTORE_VERSION, Action.FORCE_DELETE_ORPHANED_ASSETS,
        Action.VIEW_NARRATION_STATUS, Action.MANUALLY_GRANT_NARRATION, Action.REMOVE_NARRATION,
        Action.MARK_ACCOUNT_RISKY, Action.SUSPEND_ACCOUNT, Action.LIFT_SUSPENSION
    ],

    [UserRole.SUPPORT]: [
        Action.VIEW_USER_PROFILE, Action.VIEW_CHILD_PROFILE, Action.RESET_PASSWORD,
        Action.VIEW_TRANSACTION_HISTORY,
        Action.VIEW_CREDIT_BALANCE, Action.VIEW_CREDIT_TRANSACTION_HISTORY,
        Action.VIEW_UNLOCKED_ADVENTURES,
        Action.VIEW_TOTAL_SLOTS,
        Action.VIEW_SAVED_VERSIONS, Action.VIEW_VERSION_METADATA,
        Action.VIEW_NARRATION_STATUS,
        // Note: Support has NO financial/unlock capabilities as per spec "No financial or product unlock capabilities"
    ],

    [UserRole.DEVELOPER]: [
        Action.VIEW_USER_PROFILE, Action.VIEW_CHILD_PROFILE, Action.EDIT_USER_INFO, Action.RESET_PASSWORD, Action.CHANGE_USER_EMAIL, Action.CHANGE_ACCOUNT_STATUS, Action.DELETE_USER_ACCOUNT,
        Action.VIEW_TRANSACTION_HISTORY, Action.ISSUE_FULL_REFUND, Action.ISSUE_PARTIAL_REFUND,
        Action.VIEW_CREDIT_BALANCE, Action.ADD_CREDITS_MANUALLY, Action.REMOVE_CREDITS_MANUALLY, Action.COMP_PROMOTIONAL_CREDITS, Action.VIEW_CREDIT_TRANSACTION_HISTORY,
        Action.VIEW_UNLOCKED_ADVENTURES, Action.MANUALLY_UNLOCK_ADVENTURES, Action.MANUALLY_REVOKE_UNLOCKS, Action.BULK_UNLOCK_ADVENTURES,
        Action.VIEW_TOTAL_SLOTS, Action.ADD_SLOTS_MANUALLY, Action.REMOVE_SLOTS_MANUALLY, Action.DELETE_VERSION_OCCUPYING_SLOT,
        Action.VIEW_SAVED_VERSIONS, Action.VIEW_VERSION_METADATA, Action.DELETE_SAVED_VERSION, Action.RESTORE_VERSION, Action.FORCE_DELETE_ORPHANED_ASSETS,
        Action.VIEW_NARRATION_STATUS, Action.MANUALLY_GRANT_NARRATION, Action.REMOVE_NARRATION,
        Action.MARK_ACCOUNT_RISKY, Action.SUSPEND_ACCOUNT, Action.LIFT_SUSPENSION
    ],

    [UserRole.USER]: [] // Public users have their own app-level scopes
};

export class PermissionService {
    static can(role: UserRole, action: Action): boolean {
        const allowedActions = PERMISSION_MATRIX[role];
        if (!allowedActions) return false;
        return allowedActions.includes(action);
    }

    static enforce(role: UserRole, action: Action): void {
        if (!this.can(role, action)) {
            throw new Error(`Access Denied: Role ${role} cannot perform ${action}`);
        }
    }
}
