import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VariableExpense } from '../../domain/entities/variable-expense.entity';
import type {
	CreateVariableExpenseData,
	IVariableExpenseRepository,
} from '../../domain/repositories/variable-expense.repository.interface';
import {
	type VariableExpenseDocument,
	VariableExpenseRecord,
} from '../schemas/variable-expense.schema';

@Injectable()
export class MongooseVariableExpenseRepository
	implements IVariableExpenseRepository
{
	constructor(
		@InjectModel(VariableExpenseRecord.name)
		private readonly model: Model<VariableExpenseDocument>,
	) {}

	async save(data: CreateVariableExpenseData): Promise<VariableExpense> {
		const doc = await this.model.create(data);
		return this.toEntity(doc);
	}

	async findByMonth(userId: string, month: string): Promise<VariableExpense[]> {
		const docs = await this.model.find({ userId, month });
		return docs.map((doc) => this.toEntity(doc));
	}

	async findById(id: string): Promise<VariableExpense | null> {
		const doc = await this.model.findOne({ _id: id });
		return doc ? this.toEntity(doc) : null;
	}

	async delete(id: string): Promise<void> {
		await this.model.deleteOne({ _id: id });
	}

	private toEntity(doc: VariableExpenseDocument): VariableExpense {
		return new VariableExpense(
			doc._id.toString(),
			doc.userId,
			doc.name,
			doc.amount,
			doc.category,
			doc.date,
			doc.createdAt,
		);
	}
}
