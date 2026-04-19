import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type VariableIncomeDocument = HydratedDocument<VariableIncomeRecord> & {
	_id: Types.ObjectId;
	createdAt: Date;
};

@Schema({
	collection: 'variable_incomes',
	timestamps: { createdAt: true, updatedAt: false },
})
export class VariableIncomeRecord {
	@Prop({ required: true })
	userId: string;

	@Prop({ required: true })
	name: string;

	@Prop({ required: true })
	amount: number;

	@Prop()
	category?: string;

	@Prop({ required: true })
	date: string;

	@Prop({ required: true })
	month: string;
}

export const VariableIncomeSchema =
	SchemaFactory.createForClass(VariableIncomeRecord);
