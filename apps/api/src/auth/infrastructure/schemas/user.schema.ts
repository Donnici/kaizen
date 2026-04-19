import { AppFeature, AppModule } from '@kaizen/utils';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<UserRecord> & {
	_id: Types.ObjectId;
	createdAt: Date;
};

@Schema({
	collection: 'users',
	timestamps: { createdAt: true, updatedAt: false },
})
export class UserRecord {
	@Prop({ required: true })
	name: string;

	@Prop({ required: true, unique: true, index: true })
	email: string;

	@Prop({ required: true, unique: true, index: true })
	phone: string;

	@Prop({ type: [String], enum: Object.values(AppModule), default: [] })
	modules: AppModule[];

	@Prop({ type: [String], enum: Object.values(AppFeature), default: [] })
	features: AppFeature[];
}

export const UserSchema = SchemaFactory.createForClass(UserRecord);
