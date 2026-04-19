import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../shared/guards/auth.guard';
import { IdentifierUserGuard } from '../shared/guards/identifier-user.guard';
import { REQUEST_CODE_USE_CASE } from './application/use-cases/request-code.use-case';
import { RequestCodeUseCaseImpl } from './application/use-cases/request-code.use-case.impl';
import { SIGN_UP_USE_CASE } from './application/use-cases/sign-up.use-case';
import { SignUpUseCaseImpl } from './application/use-cases/sign-up.use-case.impl';
import { VERIFY_CODE_USE_CASE } from './application/use-cases/verify-code.use-case';
import { VerifyCodeUseCaseImpl } from './application/use-cases/verify-code.use-case.impl';
import { AUTH_CODE_REPOSITORY } from './domain/repositories/auth-code.repository.interface';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { MAIL_SERVICE } from './domain/services/mail.service.interface';
import { OTP_SERVICE } from './domain/services/otp.service.interface';
import { MongooseAuthCodeRepository } from './infrastructure/repositories/mongoose-auth-code.repository';
import { MongooseUserRepository } from './infrastructure/repositories/mongoose-user.repository';
import {
	AuthCodeRecord,
	AuthCodeSchema,
} from './infrastructure/schemas/auth-code.schema';
import { UserRecord, UserSchema } from './infrastructure/schemas/user.schema';
import { ConsoleMailService } from './infrastructure/services/console-mail.service';
import { OtpService } from './infrastructure/services/otp.service';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: UserRecord.name, schema: UserSchema },
			{ name: AuthCodeRecord.name, schema: AuthCodeSchema },
		]),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				secret: config.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '7d' },
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [AuthController],
	providers: [
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
		{
			provide: USER_REPOSITORY,
			useClass: MongooseUserRepository,
		},
		{
			provide: AUTH_CODE_REPOSITORY,
			useClass: MongooseAuthCodeRepository,
		},
		{
			provide: OTP_SERVICE,
			useClass: OtpService,
		},
		{
			provide: MAIL_SERVICE,
			useClass: ConsoleMailService,
		},
		{
			provide: SIGN_UP_USE_CASE,
			useClass: SignUpUseCaseImpl,
		},
		{
			provide: REQUEST_CODE_USE_CASE,
			useClass: RequestCodeUseCaseImpl,
		},
		{
			provide: VERIFY_CODE_USE_CASE,
			useClass: VerifyCodeUseCaseImpl,
		},
		IdentifierUserGuard,
	],
})
export class AuthModule {}
