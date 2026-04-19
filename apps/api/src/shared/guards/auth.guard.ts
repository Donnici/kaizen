import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { AppFeature, type AnonymousUser } from '@kaizen/utils';
import type { Request } from 'express';

const ANONYMOUS_USER: AnonymousUser = {
	anonymous: true,
	modules: [],
	features: [AppFeature.AUTH_SIGN_UP],
};

@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context
			.switchToHttp()
			.getRequest<Request & { user: AnonymousUser }>();

		// Step 2: always anonymous — token parsing implemented in step 3
		request.user = ANONYMOUS_USER;
		return true;
	}
}
