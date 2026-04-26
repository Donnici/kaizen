import type { AppFeature, AppModule } from '@kaizen/utils';

export class User {
	constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly email: string,
		public readonly phone: string,
		public readonly modules: AppModule[],
		public readonly features: AppFeature[],
		public readonly createdAt: Date,
		public readonly telegramId: string | null = null,
	) {}
}
