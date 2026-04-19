import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthCode } from '../../domain/entities/auth-code.entity';
import type {
	CreateAuthCodeData,
	IAuthCodeRepository,
} from '../../domain/repositories/auth-code.repository.interface';
import {
	type AuthCodeDocument,
	AuthCodeRecord,
} from '../schemas/auth-code.schema';

@Injectable()
export class MongooseAuthCodeRepository implements IAuthCodeRepository {
	constructor(
		@InjectModel(AuthCodeRecord.name)
		private readonly authCodeModel: Model<AuthCodeDocument>,
	) {}

	async findLatestByUserId(userId: string): Promise<AuthCode | null> {
		const doc = await this.authCodeModel.findOne({ userId });
		return doc ? this.toEntity(doc) : null;
	}

	async save(data: CreateAuthCodeData): Promise<AuthCode> {
		const doc = await this.authCodeModel.create(data);
		return this.toEntity(doc);
	}

	async markAsUsed(id: string): Promise<void> {
		await this.authCodeModel.updateOne(
			{ _id: id },
			{ $set: { usedAt: new Date() } },
		);
	}

	private toEntity(doc: AuthCodeDocument): AuthCode {
		return new AuthCode(
			doc._id.toString(),
			doc.userId,
			doc.codeHash,
			doc.expiresAt,
			doc.usedAt,
			doc.createdAt,
		);
	}
}
