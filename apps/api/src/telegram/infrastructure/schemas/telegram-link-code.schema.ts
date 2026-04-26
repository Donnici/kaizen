import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type TelegramLinkCodeDocument =
	HydratedDocument<TelegramLinkCodeRecord> & {
		_id: Types.ObjectId;
		createdAt: Date;
	};

@Schema({
	collection: 'telegram_link_codes',
	timestamps: { createdAt: true, updatedAt: false },
})
export class TelegramLinkCodeRecord {
	@Prop({ required: true })
	userId: string;

	@Prop({ required: true })
	code: string;

	@Prop({ required: true })
	expiresAt: Date;

	@Prop({ default: null, type: Date })
	usedAt: Date | null;
}

export const TelegramLinkCodeSchema = SchemaFactory.createForClass(
	TelegramLinkCodeRecord,
);
