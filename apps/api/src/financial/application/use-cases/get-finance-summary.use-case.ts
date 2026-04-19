import type { RequestUser } from '@kaizen/utils';

export const GET_FINANCE_SUMMARY_USE_CASE = Symbol(
	'GET_FINANCE_SUMMARY_USE_CASE',
);

export interface SummaryMonth {
	month: string;
	initialBalance: number;
	totalIncomes: number;
	totalExpenses: number;
	finalBalance: number;
}

export interface GetFinanceSummaryOutput {
	months: SummaryMonth[];
}

export interface IGetFinanceSummaryUseCase {
	execute(user: RequestUser): Promise<GetFinanceSummaryOutput>;
}
