import { IAuditRepository } from '../interfaces/repositories';
import { PermissionService, UserRole, Action } from '../auth/permissions';
import { randomUUID } from 'crypto';

export class AdminService {
    constructor(private auditRepo: IAuditRepository) { }

    /**
     * Example mutation that requires strict auditing and authz.
     */
    async issueUserCredits(
        actorId: string,
        actorRole: UserRole,
        targetUserId: string,
        amount: number
    ) {
        // 1. Enforce Authorization
        PermissionService.enforce(actorRole, Action.ADD_CREDITS_MANUALLY);

        // 2. Perform Business Logic (mocked here, presumably would call another repo)
        // await this.userRepo.addCredits(targetUserId, amount);
        console.log(`Issuing ${amount} credits to ${targetUserId}`);

        // 3. Audit Log
        await this.auditRepo.appendLog({
            transactionId: randomUUID(),
            actorId,
            action: Action.ADD_CREDITS_MANUALLY,
            resource: `user:${targetUserId}`,
            timestamp: new Date().toISOString(),
            details: {
                amount,
                targetUserId
            }
        });

        return { success: true };
    }
}
