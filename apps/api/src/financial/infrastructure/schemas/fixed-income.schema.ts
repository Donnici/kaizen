import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type FixedIncomeDocument = HydratedDocument<FixedIncomeRecord> & {
	_id: Types.ObjectId;
	createdAt: Date;
};

@Schema({
	collection: 'fixed_incomes',
	timestamps: { createdAt: true, updatedAt: false },
})
export class FixedIncomeRecord {
	@Prop({ required: true })
	userId: string;

	@Prop({ required: true })
	name: string;

	@Prop({ default: true })
	isActive: boolean;
}

export const FixedIncomeSchema =
	SchemaFactory.createForClass(FixedIncomeRecord);
