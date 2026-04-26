import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FixedExpense } from '../../domain/entities/fixed-expense.entity';
import type {
	CreateFixedExpenseData,
	IFixedExpenseRepository,
} from '../../domain/repositories/fixed-expense.repository.interface';
import {
	type FixedExpenseDocument,
	FixedExpenseRecord,
} from '../schemas/fixed-expense.schema';

@Injectable()
export class MongooseFixedExpenseRepository implements IFixedExpenseRepository {
	constructor(
		@InjectModel(FixedExpenseRecord.name)
		private readonly model: Model<FixedExpenseDocument>,
	) {}

	async save(data: CreateFixedExpenseData): Promise<FixedExpense> {
		const doc = await this.model.create(data);
		return this.toEntity(doc);
	}

	async findById(id: string): Promise<FixedExpense | null> {
		const doc = await this.model.findOne({ _id: id });
		return doc ? this.toEntity(doc) : null;
	}

	async findActiveByUserId(
		userId: string,
		month: string,
	): Promise<FixedExpense[]> {
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

	private toEntity(doc: FixedExpenseDocument): FixedExpense {
		return new FixedExpense(
			doc._id.toString(),
			doc.userId,
			doc.name,
			doc.deletedAt ?? null,
			doc.createdAt,
		);
	}
}
