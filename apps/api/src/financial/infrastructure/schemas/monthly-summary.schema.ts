import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type MonthlySummaryDocument = HydratedDocument<MonthlySummaryRecord> & {
	_id: Types.ObjectId;
};

@Schema({ collection: 'monthly_summaries', timestamps: false })
export class MonthlySummaryRecord {
	@Prop({ required: true })
	userId: string;

	@Prop({ required: true })
	month: string;

	@Prop({ required: true, default: 0 })
	totalIncomes: number;

	@Prop({ required: true, default: 0 })
	totalExpenses: number;

	@Prop({ required: true, default: 0 })
	initialBalance: number;

	@Prop({ required: true, default: 0 })
	finalBalance: number;
}

export const MonthlySummarySchema =
	SchemaFactory.createForClass(MonthlySummaryRecord);

MonthlySummarySchema.index({ userId: 1, month: 1 }, { unique: true });
