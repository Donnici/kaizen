import { AppFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../../shared/errors/forbidden.error';
import {
	TELEGRAM_LINK_CODE_REPOSITORY,
	type ITelegramLinkCodeRepository,
} from '../../../domain/repositories/telegram-link-code.repository.interface';
import type {
	GenerateLinkCodeInput,
	GenerateLinkCodeOutput,
	IGenerateLinkCodeUseCase,
} from './generate-link-code.use-case';

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;
const CODE_TTL_MS = 10 * 60 * 1000;

function generateCode(): string {
	let code = '';
	for (let i = 0; i < CODE_LENGTH; i++) {
		code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
	}
	return code;
}

@Injectable()
export class GenerateLinkCodeUseCaseImpl implements IGenerateLinkCodeUseCase {
	constructor(
		@Inject(TELEGRAM_LINK_CODE_REPOSITORY)
		private readonly linkCodeRepository: ITelegramLinkCodeRepository,
	) {}

	async execute(input: GenerateLinkCodeInput): Promise<GenerateLinkCodeOutput> {
		const { user } = input;

		if (user.anonymous || !user.features.includes(AppFeature.TELEGRAM_LINK)) {
			throw new ForbiddenError();
		}

		const code = generateCode();
		const expiresAt = new Date(Date.now() + CODE_TTL_MS);

		const saved = await this.linkCodeRepository.save({
			userId: user.id,
			code,
			expiresAt,
		});

		return { code: saved.code };
	}
}
