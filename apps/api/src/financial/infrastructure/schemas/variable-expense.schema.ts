import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type VariableExpenseDocument =
	HydratedDocument<VariableExpenseRecord> & {
		_id: Types.ObjectId;
		createdAt: Date;
	};

@Schema({
	collection: 'variable_expenses',
	timestamps: { createdAt: true, updatedAt: false },
})
export class VariableExpenseRecord {
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

export const VariableExpenseSchema = SchemaFactory.createForClass(
	VariableExpenseRecord,
);
