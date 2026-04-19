import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FixedIncomeRevision } from '../../domain/entities/fixed-income-revision.entity';
import type {
	CreateFixedIncomeRevisionData,
	IFixedIncomeRevisionRepository,
} from '../../domain/repositories/fixed-income-revision.repository.interface';
import {
	type FixedIncomeRevisionDocument,
	FixedIncomeRevisionRecord,
} from '../schemas/fixed-income-revision.schema';

@Injectable()
export class MongooseFixedIncomeRevisionRepository
	implements IFixedIncomeRevisionRepository
{
	constructor(
		@InjectModel(FixedIncomeRevisionRecord.name)
		private readonly model: Model<FixedIncomeRevisionDocument>,
	) {}

	async save(
		data: CreateFixedIncomeRevisionData,
	): Promise<FixedIncomeRevision> {
		const doc = await this.model.create(data);
		return this.toEntity(doc);
	}

	async findLatestForMonth(
		fixedIncomeId: string,
		month: string,
	): Promise<FixedIncomeRevision | null> {
		const doc = await this.model.findOne(
			{ fixedIncomeId, effectiveFromMonth: { $lte: month } },
			null,
			{ sort: { effectiveFromMonth: -1 } },
		);
		return doc ? this.toEntity(doc) : null;
	}

	async findAllByFixedIncomeIds(ids: string[]): Promise<FixedIncomeRevision[]> {
		const docs = await this.model.find({ fixedIncomeId: { $in: ids } });
		return docs.map((doc) => this.toEntity(doc));
	}

	private toEntity(doc: FixedIncomeRevisionDocument): FixedIncomeRevision {
		return new FixedIncomeRevision(
			doc._id.toString(),
			doc.fixedIncomeId,
			doc.amount,
			doc.effectiveFromMonth,
			doc.createdAt,
		);
	}
}
