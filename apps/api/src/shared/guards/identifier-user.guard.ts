import type { AuthenticatedUser } from '@kaizen/utils';
import {
	type CanActivate,
	type ExecutionContext,
	Inject,
	Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import {
	type IUserRepository,
	USER_REPOSITORY,
} from '../../auth/domain/repositories/user.repository.interface';

@Injectable()
export class IdentifierUserGuard implements CanActivate {
	constructor(
		@Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context
			.switchToHttp()
			.getRequest<Request & { user: unknown }>();
		const identifier: string | undefined = (
			request.body as { identifier?: string }
		)?.identifier;

		if (identifier) {
			let user = await this.userRepository.findByEmail(identifier);
			if (!user) {
				user = await this.userRepository.findByPhone(identifier);
			}
			if (user) {
				const authenticatedUser: AuthenticatedUser = {
					anonymous: false,
					id: user.id,
					name: user.name,
					email: user.email,
					phone: user.phone,
					modules: user.modules,
					features: user.features,
				};
				request.user = authenticatedUser;
			}
		}

		return true;
	}
}
