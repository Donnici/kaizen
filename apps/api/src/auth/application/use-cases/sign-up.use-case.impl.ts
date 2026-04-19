import { AppFeature, AppModule, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import { EmailAlreadyExistsError } from '../../domain/errors/email-already-exists.error';
import { PhoneAlreadyExistsError } from '../../domain/errors/phone-already-exists.error';
import {
	type IUserRepository,
	USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import type {
	ISignUpUseCase,
	SignUpInput,
	SignUpOutput,
} from './sign-up.use-case';

@Injectable()
export class SignUpUseCaseImpl implements ISignUpUseCase {
	constructor(
		@Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
	) {}

	async execute(input: SignUpInput): Promise<SignUpOutput> {
		if (!hasFeature(input.user, AppFeature.AUTH_SIGN_UP)) {
			throw new ForbiddenError();
		}

		if (await this.userRepository.findByEmail(input.email)) {
			throw new EmailAlreadyExistsError();
		}

		if (await this.userRepository.findByPhone(input.phone)) {
			throw new PhoneAlreadyExistsError();
		}

		const user = await this.userRepository.save({
			name: input.name,
			email: input.email,
			phone: input.phone,
			features: [
				AppFeature.AUTH_REQUEST_CODE,
				AppFeature.AUTH_VERIFY_CODE,
				AppFeature.FINANCIAL_FIXED_EXPENSE_READ,
				AppFeature.FINANCIAL_FIXED_EXPENSE_WRITE,
				AppFeature.FINANCIAL_VARIABLE_EXPENSE_READ,
				AppFeature.FINANCIAL_VARIABLE_EXPENSE_WRITE,
			],
			modules: [AppModule.FINANCIAL],
		});

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			modules: user.modules,
			features: user.features,
			createdAt: user.createdAt.toISOString(),
		};
	}
}
