import type { RequestUser } from '@kaizen/utils';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): RequestUser => {
		const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
		return request.user;
	},
);
