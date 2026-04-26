export const GET_TELEGRAM_SUMMARY_USE_CASE = Symbol(
	'GET_TELEGRAM_SUMMARY_USE_CASE',
);

export interface GetTelegramSummaryInput {
	telegramId: string;
	month?: string;
}

export interface GetTelegramSummaryOutput {
	month: string;
	totalIncomes: number;
	totalExpenses: number;
	finalBalance: number;
}

export interface IGetTelegramSummaryUseCase {
	execute(input: GetTelegramSummaryInput): Promise<GetTelegramSummaryOutput>;
}
