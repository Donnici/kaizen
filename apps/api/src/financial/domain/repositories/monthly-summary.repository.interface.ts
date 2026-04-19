import type { MonthlySummary } from '../entities/monthly-summary.entity';

export const MONTHLY_SUMMARY_REPOSITORY = Symbol('MONTHLY_SUMMARY_REPOSITORY');

export interface UpsertMonthlySummaryData {
	userId: string;
	month: string;
	totalIncomes: number;
	totalExpenses: number;
	initialBalance: number;
	finalBalance: number;
}

export interface IMonthlySummaryRepository {
	findByUserAndMonth(
		userId: string,
		month: string,
	): Promise<MonthlySummary | null>;
	findByUserAndMonths(
		userId: string,
		months: string[],
	): Promise<MonthlySummary[]>;
	upsertMany(data: UpsertMonthlySummaryData[]): Promise<void>;
}
