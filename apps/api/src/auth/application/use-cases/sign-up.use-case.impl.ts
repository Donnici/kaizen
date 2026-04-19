import { Inject, Injectable } from '@nestjs/common';
import { EmailAlreadyExistsError } from '../../domain/errors/email-already-exists.error';
import { PhoneAlreadyExistsError } from '../../domain/errors/phone-already-exists.error';
import {
	USER_REPOSITORY,
	type IUserRepository,
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
		if (await this.userRepository.findByEmail(input.email)) {
			throw new EmailAlreadyExistsError();
		}

		if (await this.userRepository.findByPhone(input.phone)) {
			throw new PhoneAlreadyExistsError();
		}

		const user = await this.userRepository.save(input);

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
