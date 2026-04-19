import type { AppFeature } from '../enums/app-feature.enum';
import type { AppModule } from '../enums/app-module.enum';

export type AnonymousUser = {
	anonymous: true;
	modules: [];
	features: [AppFeature.AUTH_SIGN_UP];
};

export type AuthenticatedUser = {
	anonymous: false;
	id: string;
	name: string;
	email: string;
	phone: string;
	modules: AppModule[];
	features: AppFeature[];
};

export type RequestUser = AnonymousUser | AuthenticatedUser;
