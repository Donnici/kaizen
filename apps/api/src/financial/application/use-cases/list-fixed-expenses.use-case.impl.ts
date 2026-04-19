import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import {
	FIXED_EXPENSE_REPOSITORY,
	type IFixedExpenseRepository,
} from '../../domain/repositories/fixed-expense.repository.interface';
import {
	FIXED_EXPENSE_REVISION_REPOSITORY,
	type IFixedExpenseRevisionRepository,
} from '../../domain/repositories/fixed-expense-revision.repository.interface';
import { getCurrentMonth } from '../../domain/utils/get-current-month.util';
import type {
	FixedExpenseItem,
	IListFixedExpensesUseCase,
	ListFixedExpensesInput,
} from './list-fixed-expenses.use-case';

@Injectable()
export class ListFixedExpensesUseCaseImpl implements IListFixedExpensesUseCase {
	constructor(
		@Inject(FIXED_EXPENSE_REPOSITORY)
		private readonly fixedExpenseRepository: IFixedExpenseRepository,
		@Inject(FIXED_EXPENSE_REVISION_REPOSITORY)
		private readonly revisionRepository: IFixedExpenseRevisionRepository,
	) {}

	async execute(input: ListFixedExpensesInput): Promise<FixedExpenseItem[]> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_FIXED_EXPENSE_READ)
		) {
			throw new ForbiddenError();
		}

		const month = input.month ?? getCurrentMonth();
		const expenses = await this.fixedExpenseRepository.findActiveByUserId(
			input.user.id,
		);

		const result: FixedExpenseItem[] = [];

		for (const expense of expenses) {
			const revision = await this.revisionRepository.findLatestForMonth(
				expense.id,
				month,
			);
			if (revision) {
				result.push({
					id: expense.id,
					name: expense.name,
					amount: revision.amount,
					effectiveFromMonth: revision.effectiveFromMonth,
				});
			}
		}

		return result;
	}
}
