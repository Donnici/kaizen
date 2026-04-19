import type { AppFeature, AppModule } from '@kaizen/utils';

export const SIGN_UP_USE_CASE = Symbol('SIGN_UP_USE_CASE');

export interface SignUpInput {
	name: string;
	email: string;
	phone: string;
}

export interface SignUpOutput {
	id: string;
	name: string;
	email: string;
	phone: string;
	modules: AppModule[];
	features: AppFeature[];
	createdAt: string;
}

export interface ISignUpUseCase {
	execute(input: SignUpInput): Promise<SignUpOutput>;
}
