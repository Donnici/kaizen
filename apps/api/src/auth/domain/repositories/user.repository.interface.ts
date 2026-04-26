import type { AppFeature, AppModule } from '@kaizen/utils';
import type { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserData {
	name: string;
	email: string;
	phone: string;
	features: AppFeature[];
	modules: AppModule[];
}

export interface IUserRepository {
	findByEmail(email: string): Promise<User | null>;
	findByPhone(phone: string): Promise<User | null>;
	findByTelegramId(telegramId: string): Promise<User | null>;
	save(data: CreateUserData): Promise<User>;
	updateTelegramId(userId: string, telegramId: string): Promise<void>;
}
