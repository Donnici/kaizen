import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../../auth/domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface';
import { LinkCodeExpiredError } from '../../../domain/errors/link-code-expired.error';
import { LinkCodeNotFoundError } from '../../../domain/errors/link-code-not-found.error';
import { TelegramAlreadyLinkedError } from '../../../domain/errors/telegram-already-linked.error';
import {
	TELEGRAM_LINK_CODE_REPOSITORY,
	type ITelegramLinkCodeRepository,
} from '../../../domain/repositories/telegram-link-code.repository.interface';
import type {
	ILinkTelegramAccountUseCase,
	LinkTelegramAccountInput,
} from './link-telegram-account.use-case';

@Injectable()
export class LinkTelegramAccountUseCaseImpl
	implements ILinkTelegramAccountUseCase
{
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
		@Inject(TELEGRAM_LINK_CODE_REPOSITORY)
		private readonly linkCodeRepository: ITelegramLinkCodeRepository,
	) {}

	async execute(input: LinkTelegramAccountInput): Promise<void> {
		const { telegramId, code } = input;

		const existingUser = await this.userRepository.findByTelegramId(telegramId);
		if (existingUser) {
			throw new TelegramAlreadyLinkedError();
		}

		const linkCode = await this.linkCodeRepository.findByCode(code);
		if (!linkCode) {
			throw new LinkCodeNotFoundError();
		}

		if (linkCode.expiresAt < new Date()) {
			throw new LinkCodeExpiredError();
		}

		await this.userRepository.updateTelegramId(linkCode.userId, telegramId);
		await this.linkCodeRepository.markAsUsed(linkCode.id, new Date());
	}
}
