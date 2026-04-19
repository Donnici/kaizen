import type { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserData {
	name: string;
	email: string;
	phone: string;
}

export interface IUserRepository {
	findByEmail(email: string): Promise<User | null>;
	findByPhone(phone: string): Promise<User | null>;
	save(data: CreateUserData): Promise<User>;
}
