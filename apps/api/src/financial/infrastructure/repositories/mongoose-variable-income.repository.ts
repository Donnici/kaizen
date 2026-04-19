import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VariableIncome } from '../../domain/entities/variable-income.entity';
import type {
	CreateVariableIncomeData,
	IVariableIncomeRepository,
} from '../../domain/repositories/variable-income.repository.interface';
import {
	type VariableIncomeDocument,
	VariableIncomeRecord,
} from '../schemas/variable-income.schema';

@Injectable()
export class MongooseVariableIncomeRepository
	implements IVariableIncomeRepository
{
	constructor(
		@InjectModel(VariableIncomeRecord.name)
		private readonly model: Model<VariableIncomeDocument>,
	) {}

	async save(data: CreateVariableIncomeData): Promise<VariableIncome> {
		const doc = await this.model.create(data);
		return this.toEntity(doc);
	}

	async findByMonth(userId: string, month: string): Promise<VariableIncome[]> {
		const docs = await this.model.find({ userId, month });
		return docs.map((doc) => this.toEntity(doc));
	}

	async findByMonthRange(
		userId: string,
		from: string,
		to: string,
	): Promise<VariableIncome[]> {
		const docs = await this.model.find({
			userId,
			month: { $gte: from, $lte: to },
		});
		return docs.map((doc) => this.toEntity(doc));
	}

	async findById(id: string): Promise<VariableIncome | null> {
		const doc = await this.model.findOne({ _id: id });
		return doc ? this.toEntity(doc) : null;
	}

	async delete(id: string): Promise<void> {
		await this.model.deleteOne({ _id: id });
	}

	private toEntity(doc: VariableIncomeDocument): VariableIncome {
		return new VariableIncome(
			doc._id.toString(),
			doc.userId,
			doc.name,
			doc.amount,
			doc.category,
			doc.date,
			doc.month,
			doc.createdAt,
		);
	}
}
