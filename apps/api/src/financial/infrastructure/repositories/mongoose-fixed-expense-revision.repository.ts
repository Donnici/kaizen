import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FixedExpenseRevision } from '../../domain/entities/fixed-expense-revision.entity';
import type {
	CreateFixedExpenseRevisionData,
	IFixedExpenseRevisionRepository,
} from '../../domain/repositories/fixed-expense-revision.repository.interface';
import {
	type FixedExpenseRevisionDocument,
	FixedExpenseRevisionRecord,
} from '../schemas/fixed-expense-revision.schema';

@Injectable()
export class MongooseFixedExpenseRevisionRepository
	implements IFixedExpenseRevisionRepository
{
	constructor(
		@InjectModel(FixedExpenseRevisionRecord.name)
		private readonly model: Model<FixedExpenseRevisionDocument>,
	) {}

	async save(
		data: CreateFixedExpenseRevisionData,
	): Promise<FixedExpenseRevision> {
		const doc = await this.model.create(data);
		return this.toEntity(doc);
	}

	async findLatestForMonth(
		fixedExpenseId: string,
		month: string,
	): Promise<FixedExpenseRevision | null> {
		const doc = await this.model.findOne(
			{ fixedExpenseId, effectiveFromMonth: { $lte: month } },
			null,
			{ sort: { effectiveFromMonth: -1 } },
		);
		return doc ? this.toEntity(doc) : null;
	}

	private toEntity(doc: FixedExpenseRevisionDocument): FixedExpenseRevision {
		return new FixedExpenseRevision(
			doc._id.toString(),
			doc.fixedExpenseId,
			doc.amount,
			doc.effectiveFromMonth,
			doc.createdAt,
		);
	}
}
