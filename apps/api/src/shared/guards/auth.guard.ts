import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
	AppFeature,
	type AnonymousUser,
	type AppModule,
	type AuthenticatedUser,
} from '@kaizen/utils';
import type { Request } from 'express';

interface JwtPayload {
	id: string;
	name: string;
	email: string;
	phone: string;
	modules: AppModule[];
	features: AppFeature[];
}

const ANONYMOUS_USER: AnonymousUser = {
	anonymous: true,
	modules: [],
	features: [AppFeature.AUTH_SIGN_UP],
};

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly jwtService: JwtService) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context
			.switchToHttp()
			.getRequest<Request & { user: AnonymousUser | AuthenticatedUser }>();

		const authHeader = request.headers.authorization;

		if (!authHeader) {
			request.user = ANONYMOUS_USER;
			return true;
		}

		const [type, token] = authHeader.split(' ');

		if (type !== 'Bearer' || !token) {
			throw new UnauthorizedException();
		}

		try {
			const payload = this.jwtService.verify<JwtPayload>(token);

			const authenticatedUser: AuthenticatedUser = {
				anonymous: false,
				id: payload.id,
				name: payload.name,
				email: payload.email,
				phone: payload.phone,
				modules: payload.modules,
				features: payload.features,
			};

			request.user = authenticatedUser;
			return true;
		} catch {
			throw new UnauthorizedException();
		}
	}
}
