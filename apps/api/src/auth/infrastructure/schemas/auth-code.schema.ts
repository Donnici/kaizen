import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type AuthCodeDocument = HydratedDocument<AuthCodeRecord> & {
	_id: Types.ObjectId;
	createdAt: Date;
};

@Schema({
	collection: 'auth_codes',
	timestamps: { createdAt: true, updatedAt: false },
})
export class AuthCodeRecord {
	@Prop({ required: true })
	userId: string;

	@Prop({ required: true })
	codeHash: string;

	@Prop({ required: true })
	expiresAt: Date;

	@Prop({ type: Date, default: null })
	usedAt: Date | null;
}

export const AuthCodeSchema = SchemaFactory.createForClass(AuthCodeRecord);
