import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../shared/guards/auth.guard';
import { SignUpUseCaseImpl } from './application/use-cases/sign-up.use-case.impl';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { MongooseUserRepository } from './infrastructure/repositories/mongoose-user.repository';
import { UserRecord, UserSchema } from './infrastructure/schemas/user.schema';
import { SIGN_UP_USE_CASE } from './application/use-cases/sign-up.use-case';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: UserRecord.name, schema: UserSchema },
		]),
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
			provide: SIGN_UP_USE_CASE,
			useClass: SignUpUseCaseImpl,
		},
	],
})
export class AuthModule {}
