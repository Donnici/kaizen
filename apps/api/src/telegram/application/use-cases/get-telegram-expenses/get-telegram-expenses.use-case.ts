export const GET_TELEGRAM_EXPENSES_USE_CASE = Symbol(
	'GET_TELEGRAM_EXPENSES_USE_CASE',
);

export interface GetTelegramExpensesInput {
	telegramId: string;
	month?: string;
}

export interface TelegramExpenseEntry {
	name: string;
	amount: number;
}

export interface GetTelegramExpensesOutput {
	month: string;
	fixed: TelegramExpenseEntry[];
	variable: TelegramExpenseEntry[];
}

export interface IGetTelegramExpensesUseCase {
	execute(
		input: GetTelegramExpensesInput,
	): Promise<GetTelegramExpensesOutput>;
}
