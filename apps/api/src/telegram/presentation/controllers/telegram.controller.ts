import type { RequestUser } from '@kaizen/utils';
import {
	Controller,
	ForbiddenException,
	HttpCode,
	Inject,
	Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import {
	GENERATE_LINK_CODE_USE_CASE,
	type IGenerateLinkCodeUseCase,
} from '../../application/use-cases/generate-link-code/generate-link-code.use-case';

@Controller('telegram')
export class TelegramController {
	constructor(
		@Inject(GENERATE_LINK_CODE_USE_CASE)
		private readonly generateLinkCodeUseCase: IGenerateLinkCodeUseCase,
	) {}

	@Post('link-code')
	@HttpCode(201)
	async generateLinkCode(@CurrentUser() user: RequestUser) {
		try {
			return await this.generateLinkCodeUseCase.execute({ user });
		} catch (error) {
			if (error instanceof ForbiddenError) throw new ForbiddenException();
			throw error;
		}
	}
}
