import type { RequestUser } from '@kaizen/utils';
import {
	Body,
	ConflictException,
	Controller,
	ForbiddenException,
	HttpCode,
	Inject,
	Post,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import { IdentifierUserGuard } from '../../../shared/guards/identifier-user.guard';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';
import {
	type IRequestCodeUseCase,
	REQUEST_CODE_USE_CASE,
} from '../../application/use-cases/request-code.use-case';
import {
	type ISignUpUseCase,
	SIGN_UP_USE_CASE,
} from '../../application/use-cases/sign-up.use-case';
import {
	type IVerifyCodeUseCase,
	VERIFY_CODE_USE_CASE,
} from '../../application/use-cases/verify-code.use-case';
import { CodeAlreadyUsedError } from '../../domain/errors/code-already-used.error';
import { CodeExpiredError } from '../../domain/errors/code-expired.error';
import { EmailAlreadyExistsError } from '../../domain/errors/email-already-exists.error';
import { InvalidCodeError } from '../../domain/errors/invalid-code.error';
import { PhoneAlreadyExistsError } from '../../domain/errors/phone-already-exists.error';
import { UnauthorizedError } from '../../domain/errors/unauthorized.error';
import {
	type RequestCodeDto,
	RequestCodeSchema,
} from '../dtos/request-code.dto';
import { type SignUpDto, SignUpSchema } from '../dtos/sign-up.dto';
import { type VerifyCodeDto, VerifyCodeSchema } from '../dtos/verify-code.dto';

@Controller('auth')
export class AuthController {
	constructor(
		@Inject(SIGN_UP_USE_CASE) private readonly signUpUseCase: ISignUpUseCase,
		@Inject(REQUEST_CODE_USE_CASE)
		private readonly requestCodeUseCase: IRequestCodeUseCase,
		@Inject(VERIFY_CODE_USE_CASE)
		private readonly verifyCodeUseCase: IVerifyCodeUseCase,
	) {}

	@Post('sign-up')
	@HttpCode(201)
	async signUp(
		@CurrentUser() user: RequestUser,
		@Body(new ZodValidationPipe(SignUpSchema)) dto: SignUpDto,
	) {
		try {
			return await this.signUpUseCase.execute({ ...dto, user });
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			if (error instanceof EmailAlreadyExistsError)
				throw new ConflictException('Email already registered');
			if (error instanceof PhoneAlreadyExistsError)
				throw new ConflictException('Phone already registered');
			throw error;
		}
	}

	@Post('request-code')
	@HttpCode(204)
	@UseGuards(IdentifierUserGuard)
	async requestCode(
		@CurrentUser() user: RequestUser,
		@Body(new ZodValidationPipe(RequestCodeSchema)) _dto: RequestCodeDto,
	) {
		await this.requestCodeUseCase.execute({ user });
	}

	@Post('verify-code')
	@HttpCode(200)
	@UseGuards(IdentifierUserGuard)
	async verifyCode(
		@CurrentUser() user: RequestUser,
		@Body(new ZodValidationPipe(VerifyCodeSchema)) dto: VerifyCodeDto,
	) {
		try {
			return await this.verifyCodeUseCase.execute({ user, code: dto.code });
		} catch (error) {
			if (
				error instanceof UnauthorizedError ||
				error instanceof InvalidCodeError ||
				error instanceof CodeExpiredError ||
				error instanceof CodeAlreadyUsedError
			) {
				throw new UnauthorizedException((error as Error).message);
			}
			throw error;
		}
	}
}
