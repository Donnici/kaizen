export const GET_TELEGRAM_INCOMES_USE_CASE = Symbol(
	'GET_TELEGRAM_INCOMES_USE_CASE',
);

export interface GetTelegramIncomesInput {
	telegramId: string;
	month?: string;
}

export interface TelegramIncomeEntry {
	name: string;
	amount: number;
}

export interface GetTelegramIncomesOutput {
	month: string;
	fixed: TelegramIncomeEntry[];
	variable: TelegramIncomeEntry[];
}

export interface IGetTelegramIncomesUseCase {
	execute(input: GetTelegramIncomesInput): Promise<GetTelegramIncomesOutput>;
}
