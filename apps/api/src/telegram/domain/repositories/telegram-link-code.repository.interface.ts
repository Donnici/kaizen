import type { TelegramLinkCode } from '../entities/telegram-link-code.entity';

export const TELEGRAM_LINK_CODE_REPOSITORY = Symbol(
	'TELEGRAM_LINK_CODE_REPOSITORY',
);

export interface CreateTelegramLinkCodeData {
	userId: string;
	code: string;
	expiresAt: Date;
}

export interface ITelegramLinkCodeRepository {
	save(data: CreateTelegramLinkCodeData): Promise<TelegramLinkCode>;
	findByCode(code: string): Promise<TelegramLinkCode | null>;
	markAsUsed(id: string, date: Date): Promise<void>;
}
