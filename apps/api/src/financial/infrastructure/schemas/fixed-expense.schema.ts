import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type FixedExpenseDocument = HydratedDocument<FixedExpenseRecord> & {
	_id: Types.ObjectId;
	createdAt: Date;
};

@Schema({
	collection: 'fixed_expenses',
	timestamps: { createdAt: true, updatedAt: false },
})
export class FixedExpenseRecord {
	@Prop({ required: true })
	userId: string;

	@Prop({ required: true })
	name: string;

	@Prop({ default: true })
	isActive: boolean;
}

export const FixedExpenseSchema =
	SchemaFactory.createForClass(FixedExpenseRecord);
