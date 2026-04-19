import {
	Body,
	ConflictException,
	Controller,
	HttpCode,
	Inject,
	Post,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';
import { EmailAlreadyExistsError } from '../../domain/errors/email-already-exists.error';
import { PhoneAlreadyExistsError } from '../../domain/errors/phone-already-exists.error';
import {
	SIGN_UP_USE_CASE,
	type ISignUpUseCase,
} from '../../application/use-cases/sign-up.use-case';
import { SignUpSchema, type SignUpDto } from '../dtos/sign-up.dto';

@Controller('auth')
export class AuthController {
	constructor(
		@Inject(SIGN_UP_USE_CASE) private readonly signUpUseCase: ISignUpUseCase,
	) {}

	@Post('sign-up')
	@HttpCode(201)
	async signUp(@Body(new ZodValidationPipe(SignUpSchema)) dto: SignUpDto) {
		try {
			return await this.signUpUseCase.execute(dto);
		} catch (error) {
			if (error instanceof EmailAlreadyExistsError) {
				throw new ConflictException('Email already registered');
			}
			if (error instanceof PhoneAlreadyExistsError) {
				throw new ConflictException('Phone already registered');
			}
			throw error;
		}
	}
}
