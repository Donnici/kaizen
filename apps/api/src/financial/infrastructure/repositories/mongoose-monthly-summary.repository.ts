import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MonthlySummary } from '../../domain/entities/monthly-summary.entity';
import type {
	IMonthlySummaryRepository,
	UpsertMonthlySummaryData,
} from '../../domain/repositories/monthly-summary.repository.interface';
import {
	type MonthlySummaryDocument,
	MonthlySummaryRecord,
} from '../schemas/monthly-summary.schema';

@Injectable()
export class MongooseMonthlySummaryRepository
	implements IMonthlySummaryRepository
{
	constructor(
		@InjectModel(MonthlySummaryRecord.name)
		private readonly model: Model<MonthlySummaryDocument>,
	) {}

	async findByUserAndMonth(
		userId: string,
		month: string,
	): Promise<MonthlySummary | null> {
		const doc = await this.model.findOne({ userId, month });
		return doc ? this.toEntity(doc) : null;
	}

	async findByUserAndMonths(
		userId: string,
		months: string[],
	): Promise<MonthlySummary[]> {
		const docs = await this.model.find({ userId, month: { $in: months } });
		return docs.map((doc) => this.toEntity(doc));
	}

	async upsertMany(data: UpsertMonthlySummaryData[]): Promise<void> {
		if (data.length === 0) return;
		await this.model.bulkWrite(
			data.map((s) => ({
				updateOne: {
					filter: { userId: s.userId, month: s.month },
					update: { $set: s },
					upsert: true,
				},
			})),
		);
	}

	private toEntity(doc: MonthlySummaryDocument): MonthlySummary {
		return new MonthlySummary(
			doc._id.toString(),
			doc.userId,
			doc.month,
			doc.totalIncomes,
			doc.totalExpenses,
			doc.initialBalance,
			doc.finalBalance,
		);
	}
}
