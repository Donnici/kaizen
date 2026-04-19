import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CodeAlreadyUsedError } from '../../domain/errors/code-already-used.error';
import { CodeExpiredError } from '../../domain/errors/code-expired.error';
import { InvalidCodeError } from '../../domain/errors/invalid-code.error';
import { UnauthorizedError } from '../../domain/errors/unauthorized.error';
import {
	AUTH_CODE_REPOSITORY,
	type IAuthCodeRepository,
} from '../../domain/repositories/auth-code.repository.interface';
import {
	type IOtpService,
	OTP_SERVICE,
} from '../../domain/services/otp.service.interface';
import type {
	IVerifyCodeUseCase,
	VerifyCodeInput,
	VerifyCodeOutput,
} from './verify-code.use-case';

@Injectable()
export class VerifyCodeUseCaseImpl implements IVerifyCodeUseCase {
	constructor(
		@Inject(AUTH_CODE_REPOSITORY)
		private readonly authCodeRepository: IAuthCodeRepository,
		@Inject(OTP_SERVICE) private readonly otpService: IOtpService,
		private readonly jwtService: JwtService,
	) {}

	async execute(input: VerifyCodeInput): Promise<VerifyCodeOutput> {
		const { user, code } = input;

		if (user.anonymous) {
			throw new UnauthorizedError();
		}

		if (!hasFeature(user, AppFeature.AUTH_VERIFY_CODE)) {
			throw new UnauthorizedError();
		}

		const authCode = await this.authCodeRepository.findLatestByUserId(user.id);

		if (!authCode) {
			throw new UnauthorizedError();
		}

		if (!this.otpService.verify(code, authCode.codeHash)) {
			throw new InvalidCodeError();
		}

		if (authCode.isExpired) {
			throw new CodeExpiredError();
		}

		if (authCode.isUsed) {
			throw new CodeAlreadyUsedError();
		}

		await this.authCodeRepository.markAsUsed(authCode.id);

		const token = this.jwtService.sign({
			id: user.id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			modules: user.modules,
			features: user.features,
		});

		return { token };
	}
}
