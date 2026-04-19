import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type FixedIncomeRevisionDocument =
	HydratedDocument<FixedIncomeRevisionRecord> & {
		_id: Types.ObjectId;
		createdAt: Date;
	};

@Schema({
	collection: 'fixed_income_revisions',
	timestamps: { createdAt: true, updatedAt: false },
})
export class FixedIncomeRevisionRecord {
	@Prop({ required: true })
	fixedIncomeId: string;

	@Prop({ required: true, type: Number })
	amount: number;

	@Prop({ required: true })
	effectiveFromMonth: string;
}

export const FixedIncomeRevisionSchema = SchemaFactory.createForClass(
	FixedIncomeRevisionRecord,
);
