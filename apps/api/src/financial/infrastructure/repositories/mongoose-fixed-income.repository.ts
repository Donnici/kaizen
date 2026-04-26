import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FixedIncome } from '../../domain/entities/fixed-income.entity';
import type {
	CreateFixedIncomeData,
	IFixedIncomeRepository,
} from '../../domain/repositories/fixed-income.repository.interface';
import {
	type FixedIncomeDocument,
	FixedIncomeRecord,
} from '../schemas/fixed-income.schema';

@Injectable()
export class MongooseFixedIncomeRepository implements IFixedIncomeRepository {
	constructor(
		@InjectModel(FixedIncomeRecord.name)
		private readonly model: Model<FixedIncomeDocument>,
	) {}

	async save(data: CreateFixedIncomeData): Promise<FixedIncome> {
		const doc = await this.model.create(data);
		return this.toEntity(doc);
	}

	async findById(id: string): Promise<FixedIncome | null> {
		const doc = await this.model.findOne({ _id: id });
		return doc ? this.toEntity(doc) : null;
	}

	async findActiveByUserId(
		userId: string,
		month: string,
	): Promise<FixedIncome[]> {
		const [year, monthNum] = month.split('-').map(Number);
		const startOfNextMonth = new Date(Date.UTC(year, monthNum, 1));
		const docs = await this.model.find({
			userId,
			$or: [{ deletedAt: null }, { deletedAt: { $gte: startOfNextMonth } }],
		});
		return docs.map((doc) => this.toEntity(doc));
	}

	async deactivate(id: string, date: Date): Promise<void> {
		await this.model.updateOne({ _id: id }, { $set: { deletedAt: date } });
	}

	private toEntity(doc: FixedIncomeDocument): FixedIncome {
		return new FixedIncome(
			doc._id.toString(),
			doc.userId,
			doc.name,
			doc.deletedAt ?? null,
			doc.createdAt,
		);
	}
}
