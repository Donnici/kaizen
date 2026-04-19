import { Inject, Injectable } from '@nestjs/common';
import { AppFeature, hasFeature } from '@kaizen/utils';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import { FixedExpenseNotFoundError } from '../../domain/errors/fixed-expense-not-found.error';
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
	IUpdateFixedExpenseAmountUseCase,
	UpdateFixedExpenseAmountInput,
	UpdateFixedExpenseAmountOutput,
} from './update-fixed-expense-amount.use-case';

@Injectable()
export class UpdateFixedExpenseAmountUseCaseImpl
	implements IUpdateFixedExpenseAmountUseCase
{
	constructor(
		@Inject(FIXED_EXPENSE_REPOSITORY)
		private readonly fixedExpenseRepository: IFixedExpenseRepository,
		@Inject(FIXED_EXPENSE_REVISION_REPOSITORY)
		private readonly revisionRepository: IFixedExpenseRevisionRepository,
	) {}

	async execute(
		input: UpdateFixedExpenseAmountInput,
	): Promise<UpdateFixedExpenseAmountOutput> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_FIXED_EXPENSE_WRITE)
		) {
			throw new ForbiddenError();
		}

		const expense = await this.fixedExpenseRepository.findById(input.id);

		if (!expense) {
			throw new FixedExpenseNotFoundError();
		}

		if (expense.userId !== input.user.id) {
			throw new ForbiddenError();
		}

		const revision = await this.revisionRepository.save({
			fixedExpenseId: expense.id,
			amount: input.amount,
			effectiveFromMonth: getCurrentMonth(),
		});

		return {
			id: expense.id,
			name: expense.name,
			amount: revision.amount,
			effectiveFromMonth: revision.effectiveFromMonth,
		};
	}
}
