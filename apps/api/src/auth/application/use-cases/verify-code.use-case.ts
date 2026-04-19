import type { RequestUser } from '@kaizen/utils';

export const VERIFY_CODE_USE_CASE = Symbol('VERIFY_CODE_USE_CASE');

export interface VerifyCodeInput {
	user: RequestUser;
	code: string;
}

export interface VerifyCodeOutput {
	token: string;
}

export interface IVerifyCodeUseCase {
	execute(input: VerifyCodeInput): Promise<VerifyCodeOutput>;
}
