import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../domain/entities/user.entity';
import type {
	CreateUserData,
	IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import { type UserDocument, UserRecord } from '../schemas/user.schema';

@Injectable()
export class MongooseUserRepository implements IUserRepository {
	constructor(
		@InjectModel(UserRecord.name)
		private readonly userModel: Model<UserDocument>,
	) {}

	async findByEmail(email: string): Promise<User | null> {
		const doc = await this.userModel.findOne({ email });
		return doc ? this.toEntity(doc) : null;
	}

	async findByPhone(phone: string): Promise<User | null> {
		const doc = await this.userModel.findOne({ phone });
		return doc ? this.toEntity(doc) : null;
	}

	async save(data: CreateUserData): Promise<User> {
		const doc = await this.userModel.create({
			name: data.name,
			email: data.email,
			phone: data.phone,
			features: data.features,
			modules: data.modules,
		});
		return this.toEntity(doc);
	}

	private toEntity(doc: UserDocument): User {
		return new User(
			doc._id.toString(),
			doc.name,
			doc.email,
			doc.phone,
			doc.modules,
			doc.features,
			doc.createdAt,
		);
	}
}
