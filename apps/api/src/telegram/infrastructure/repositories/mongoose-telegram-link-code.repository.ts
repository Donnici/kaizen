import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TelegramLinkCode } from '../../domain/entities/telegram-link-code.entity';
import type {
	CreateTelegramLinkCodeData,
	ITelegramLinkCodeRepository,
} from '../../domain/repositories/telegram-link-code.repository.interface';
import {
	type TelegramLinkCodeDocument,
	TelegramLinkCodeRecord,
} from '../schemas/telegram-link-code.schema';

@Injectable()
export class MongooseTelegramLinkCodeRepository
	implements ITelegramLinkCodeRepository
{
	constructor(
		@InjectModel(TelegramLinkCodeRecord.name)
		private readonly model: Model<TelegramLinkCodeDocument>,
	) {}

	async save(data: CreateTelegramLinkCodeData): Promise<TelegramLinkCode> {
		const doc = await this.model.create(data);
		return this.toEntity(doc);
	}

	async findByCode(code: string): Promise<TelegramLinkCode | null> {
		const doc = await this.model.findOne({ code, usedAt: null });
		return doc ? this.toEntity(doc) : null;
	}

	async markAsUsed(id: string, date: Date): Promise<void> {
		await this.model.updateOne({ _id: id }, { $set: { usedAt: date } });
	}

	private toEntity(doc: TelegramLinkCodeDocument): TelegramLinkCode {
		return new TelegramLinkCode(
			doc._id.toString(),
			doc.userId,
			doc.code,
			doc.expiresAt,
			doc.usedAt ?? null,
		);
	}
}
