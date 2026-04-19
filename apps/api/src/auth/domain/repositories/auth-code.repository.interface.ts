import type { AuthCode } from '../entities/auth-code.entity';

export const AUTH_CODE_REPOSITORY = Symbol('AUTH_CODE_REPOSITORY');

export interface CreateAuthCodeData {
	userId: string;
	codeHash: string;
	expiresAt: Date;
}

export interface IAuthCodeRepository {
	findLatestByUserId(userId: string): Promise<AuthCode | null>;
	save(data: CreateAuthCodeData): Promise<AuthCode>;
	markAsUsed(id: string): Promise<void>;
}
