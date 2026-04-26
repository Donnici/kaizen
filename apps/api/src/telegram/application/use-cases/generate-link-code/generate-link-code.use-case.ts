import type { RequestUser } from '@kaizen/utils';

export const GENERATE_LINK_CODE_USE_CASE = Symbol('GENERATE_LINK_CODE_USE_CASE');

export interface GenerateLinkCodeInput {
	user: RequestUser;
}

export interface GenerateLinkCodeOutput {
	code: string;
}

export interface IGenerateLinkCodeUseCase {
	execute(input: GenerateLinkCodeInput): Promise<GenerateLinkCodeOutput>;
}
