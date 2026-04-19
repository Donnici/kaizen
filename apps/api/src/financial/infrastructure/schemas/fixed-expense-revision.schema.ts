import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type FixedExpenseRevisionDocument =
	HydratedDocument<FixedExpenseRevisionRecord> & {
		_id: Types.ObjectId;
		createdAt: Date;
	};

@Schema({
	collection: 'fixed_expense_revisions',
	timestamps: { createdAt: true, updatedAt: false },
})
export class FixedExpenseRevisionRecord {
	@Prop({ required: true })
	fixedExpenseId: string;

	@Prop({ required: true, type: Number })
	amount: number;

	@Prop({ required: true })
	effectiveFromMonth: string;
}

export const FixedExpenseRevisionSchema = SchemaFactory.createForClass(
	FixedExpenseRevisionRecord,
);
