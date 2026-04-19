import { AppFeature, hasFeature, type RequestUser } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import {
	type IMonthlySummaryRepository,
	MONTHLY_SUMMARY_REPOSITORY,
} from '../../domain/repositories/monthly-summary.repository.interface';
import { getCurrentMonth } from '../../domain/utils/get-current-month.util';
import { shiftMonth } from '../../domain/utils/shift-month.util';
import type {
	GetFinanceSummaryOutput,
	IGetFinanceSummaryUseCase,
} from './get-finance-summary.use-case';

@Injectable()
export class GetFinanceSummaryUseCaseImpl implements IGetFinanceSummaryUseCase {
	constructor(
		@Inject(MONTHLY_SUMMARY_REPOSITORY)
		private readonly summaryRepo: IMonthlySummaryRepository,
	) {}

	async execute(user: RequestUser): Promise<GetFinanceSummaryOutput> {
		if (
			user.anonymous ||
			!hasFeature(user, AppFeature.FINANCIAL_SUMMARY_READ)
		) {
			throw new ForbiddenError();
		}

		const current = getCurrentMonth();
		const months = [
			shiftMonth(current, -1),
			current,
			shiftMonth(current, 1),
			shiftMonth(current, 2),
			shiftMonth(current, 3),
			shiftMonth(current, 4),
			shiftMonth(current, 5),
			shiftMonth(current, 6),
		];

		const stored = await this.summaryRepo.findByUserAndMonths(user.id, months);
		const byMonth = new Map(stored.map((s) => [s.month, s]));

		return {
			months: months.map((month) => {
				const s = byMonth.get(month);
				return {
					month,
					initialBalance: s?.initialBalance ?? 0,
					totalIncomes: s?.totalIncomes ?? 0,
					totalExpenses: s?.totalExpenses ?? 0,
					finalBalance: s?.finalBalance ?? 0,
				};
			}),
		};
	}
}
