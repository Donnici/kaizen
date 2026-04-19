import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import {
	FIXED_INCOME_REPOSITORY,
	type IFixedIncomeRepository,
} from '../../domain/repositories/fixed-income.repository.interface';
import {
	FIXED_INCOME_REVISION_REPOSITORY,
	type IFixedIncomeRevisionRepository,
} from '../../domain/repositories/fixed-income-revision.repository.interface';
import { getCurrentMonth } from '../../domain/utils/get-current-month.util';
import type {
	FixedIncomeItem,
	IListFixedIncomesUseCase,
	ListFixedIncomesInput,
} from './list-fixed-incomes.use-case';

@Injectable()
export class ListFixedIncomesUseCaseImpl implements IListFixedIncomesUseCase {
	constructor(
		@Inject(FIXED_INCOME_REPOSITORY)
		private readonly fixedIncomeRepository: IFixedIncomeRepository,
		@Inject(FIXED_INCOME_REVISION_REPOSITORY)
		private readonly revisionRepository: IFixedIncomeRevisionRepository,
	) {}

	async execute(input: ListFixedIncomesInput): Promise<FixedIncomeItem[]> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_FIXED_INCOME_READ)
		) {
			throw new ForbiddenError();
		}

		const month = input.month ?? getCurrentMonth();
		const incomes = await this.fixedIncomeRepository.findActiveByUserId(
			input.user.id,
		);

		const result: FixedIncomeItem[] = [];

		for (const income of incomes) {
			const revision = await this.revisionRepository.findLatestForMonth(
				income.id,
				month,
			);
			if (revision) {
				result.push({
					id: income.id,
					name: income.name,
					amount: revision.amount,
					effectiveFromMonth: revision.effectiveFromMonth,
				});
			}
		}

		return result;
	}
}
