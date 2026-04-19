import type { RequestUser } from '@kaizen/utils';

export const REQUEST_CODE_USE_CASE = Symbol('REQUEST_CODE_USE_CASE');

export interface RequestCodeInput {
	user: RequestUser;
}

export interface IRequestCodeUseCase {
	execute(input: RequestCodeInput): Promise<void>;
}
