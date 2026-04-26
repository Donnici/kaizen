export const LINK_TELEGRAM_ACCOUNT_USE_CASE = Symbol(
	'LINK_TELEGRAM_ACCOUNT_USE_CASE',
);

export interface LinkTelegramAccountInput {
	telegramId: string;
	code: string;
}

export interface ILinkTelegramAccountUseCase {
	execute(input: LinkTelegramAccountInput): Promise<void>;
}
