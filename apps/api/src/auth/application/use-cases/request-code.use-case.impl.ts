import { Inject, Injectable } from '@nestjs/common';
import { AppFeature, hasFeature } from '@kaizen/utils';
import {
	AUTH_CODE_REPOSITORY,
	type IAuthCodeRepository,
} from '../../domain/repositories/auth-code.repository.interface';
import {
	MAIL_SERVICE,
	type IMailService,
} from '../../domain/services/mail.service.interface';
import {
	OTP_SERVICE,
	type IOtpService,
} from '../../domain/services/otp.service.interface';
import type { IRequestCodeUseCase, RequestCodeInput } from './request-code.use-case';

const CODE_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class RequestCodeUseCaseImpl implements IRequestCodeUseCase {
	constructor(
		@Inject(AUTH_CODE_REPOSITORY)
		private readonly authCodeRepository: IAuthCodeRepository,
		@Inject(OTP_SERVICE) private readonly otpService: IOtpService,
		@Inject(MAIL_SERVICE) private readonly mailService: IMailService,
	) {}

	async execute(input: RequestCodeInput): Promise<void> {
		const { user } = input;

		if (user.anonymous || !hasFeature(user, AppFeature.AUTH_REQUEST_CODE)) {
			return;
		}

		const code = this.otpService.generate();
		const codeHash = this.otpService.hash(code);
		const expiresAt = new Date(Date.now() + CODE_TTL_MS);

		await this.authCodeRepository.save({ userId: user.id, codeHash, expiresAt });
		await this.mailService.sendAuthCode(user.email, code);
	}
}
