import { Inject, Injectable } from '@nestjs/common';
import {
	FIXED_EXPENSE_REPOSITORY,
	type IFixedExpenseRepository,
} from '../../domain/repositories/fixed-expense.repository.interface';
import {
	FIXED_EXPENSE_REVISION_REPOSITORY,
	type IFixedExpenseRevisionRepository,
} from '../../domain/repositories/fixed-expense-revision.repository.interface';
import {
	FIXED_INCOME_REPOSITORY,
	type IFixedIncomeRepository,
} from '../../domain/repositories/fixed-income.repository.interface';
import {
	FIXED_INCOME_REVISION_REPOSITORY,
	type IFixedIncomeRevisionRepository,
} from '../../domain/repositories/fixed-income-revision.repository.interface';
import {
	type IMonthlySummaryRepository,
	MONTHLY_SUMMARY_REPOSITORY,
} from '../../domain/repositories/monthly-summary.repository.interface';
import {
	type IVariableExpenseRepository,
	VARIABLE_EXPENSE_REPOSITORY,
} from '../../domain/repositories/variable-expense.repository.interface';
import {
	type IVariableIncomeRepository,
	VARIABLE_INCOME_REPOSITORY,
} from '../../domain/repositories/variable-income.repository.interface';
import { getCurrentMonth } from '../../domain/utils/get-current-month.util';
import { shiftMonth } from '../../domain/utils/shift-month.util';
import type {
	IRecalculateSummaryUseCase,
	RecalculateSummaryInput,
} from './recalculate-summary.use-case';

@Injectable()
export class RecalculateSummaryUseCaseImpl
	implements IRecalculateSummaryUseCase
{
	constructor(
		@Inject(FIXED_EXPENSE_REPOSITORY)
		private readonly fixedExpenseRepo: IFixedExpenseRepository,
		@Inject(FIXED_EXPENSE_REVISION_REPOSITORY)
		private readonly fixedExpenseRevisionRepo: IFixedExpenseRevisionRepository,
		@Inject(FIXED_INCOME_REPOSITORY)
		private readonly fixedIncomeRepo: IFixedIncomeRepository,
		@Inject(FIXED_INCOME_REVISION_REPOSITORY)
		private readonly fixedIncomeRevisionRepo: IFixedIncomeRevisionRepository,
		@Inject(VARIABLE_EXPENSE_REPOSITORY)
		private readonly variableExpenseRepo: IVariableExpenseRepository,
		@Inject(VARIABLE_INCOME_REPOSITORY)
		private readonly variableIncomeRepo: IVariableIncomeRepository,
		@Inject(MONTHLY_SUMMARY_REPOSITORY)
		private readonly summaryRepo: IMonthlySummaryRepository,
	) {}

	async execute({ userId, fromMonth }: RecalculateSummaryInput): Promise<void> {
		const computeUntil = shiftMonth(getCurrentMonth(), 12);

		const [
			fixedExpenses,
			fixedIncomes,
			prevSummary,
			variableExpenses,
			variableIncomes,
		] = await Promise.all([
			this.fixedExpenseRepo.findActiveByUserId(userId),
			this.fixedIncomeRepo.findActiveByUserId(userId),
			this.summaryRepo.findByUserAndMonth(userId, shiftMonth(fromMonth, -1)),
			this.variableExpenseRepo.findByMonthRange(
				userId,
				fromMonth,
				computeUntil,
			),
			this.variableIncomeRepo.findByMonthRange(userId, fromMonth, computeUntil),
		]);

		const [fixedExpenseRevisions, fixedIncomeRevisions] = await Promise.all([
			fixedExpenses.length > 0
				? this.fixedExpenseRevisionRepo.findAllByFixedExpenseIds(
						fixedExpenses.map((e) => e.id),
					)
				: Promise.resolve([]),
			fixedIncomes.length > 0
				? this.fixedIncomeRevisionRepo.findAllByFixedIncomeIds(
						fixedIncomes.map((i) => i.id),
					)
				: Promise.resolve([]),
		]);

		const revisionsByExpenseId = new Map<
			string,
			{ effectiveFromMonth: string; amount: number }[]
		>();
		for (const rev of fixedExpenseRevisions) {
			const list = revisionsByExpenseId.get(rev.fixedExpenseId) ?? [];
			list.push(rev);
			revisionsByExpenseId.set(rev.fixedExpenseId, list);
		}

		const revisionsByIncomeId = new Map<
			string,
			{ effectiveFromMonth: string; amount: number }[]
		>();
		for (const rev of fixedIncomeRevisions) {
			const list = revisionsByIncomeId.get(rev.fixedIncomeId) ?? [];
			list.push(rev);
			revisionsByIncomeId.set(rev.fixedIncomeId, list);
		}

		const varExpensesByMonth = new Map<string, number>();
		for (const e of variableExpenses) {
			varExpensesByMonth.set(
				e.month,
				(varExpensesByMonth.get(e.month) ?? 0) + e.amount,
			);
		}

		const varIncomesByMonth = new Map<string, number>();
		for (const i of variableIncomes) {
			varIncomesByMonth.set(
				i.month,
				(varIncomesByMonth.get(i.month) ?? 0) + i.amount,
			);
		}

		let runningBalance = prevSummary?.finalBalance ?? 0;
		const summaries: {
			userId: string;
			month: string;
			totalIncomes: number;
			totalExpenses: number;
			initialBalance: number;
			finalBalance: number;
		}[] = [];

		let month = fromMonth;
		while (month <= computeUntil) {
			const totalExpenses =
				fixedExpenses.reduce((sum, expense) => {
					const revisions = revisionsByExpenseId.get(expense.id) ?? [];
					const latest = this.findLatestRevisionForMonth(revisions, month);
					return latest ? sum + latest.amount : sum;
				}, 0) + (varExpensesByMonth.get(month) ?? 0);

			const totalIncomes =
				fixedIncomes.reduce((sum, income) => {
					const revisions = revisionsByIncomeId.get(income.id) ?? [];
					const latest = this.findLatestRevisionForMonth(revisions, month);
					return latest ? sum + latest.amount : sum;
				}, 0) + (varIncomesByMonth.get(month) ?? 0);

			const initialBalance = runningBalance;
			const finalBalance = initialBalance + totalIncomes - totalExpenses;

			summaries.push({
				userId,
				month,
				totalIncomes,
				totalExpenses,
				initialBalance,
				finalBalance,
			});

			runningBalance = finalBalance;
			month = shiftMonth(month, 1);
		}

		await this.summaryRepo.upsertMany(summaries);
	}

	private findLatestRevisionForMonth(
		revisions: { effectiveFromMonth: string; amount: number }[],
		month: string,
	): { effectiveFromMonth: string; amount: number } | null {
		return (
			revisions
				.filter((r) => r.effectiveFromMonth <= month)
				.sort((a, b) =>
					b.effectiveFromMonth.localeCompare(a.effectiveFromMonth),
				)[0] ?? null
		);
	}
}
