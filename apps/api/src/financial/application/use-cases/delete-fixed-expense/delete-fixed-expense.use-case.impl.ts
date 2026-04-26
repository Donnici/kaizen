import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../../shared/errors/forbidden.error';
import { FixedExpenseNotFoundError } from '../../../domain/errors/fixed-expense-not-found.error';
import {
	FIXED_EXPENSE_REPOSITORY,
	type IFixedExpenseRepository,
} from '../../../domain/repositories/fixed-expense.repository.interface';
import type {
	DeleteFixedExpenseInput,
	IDeleteFixedExpenseUseCase,
} from './delete-fixed-expense.use-case';

@Injectable()
export class DeleteFixedExpenseUseCaseImpl
	implements IDeleteFixedExpenseUseCase
{
	constructor(
		@Inject(FIXED_EXPENSE_REPOSITORY)
		private readonly fixedExpenseRepository: IFixedExpenseRepository,
	) {}

	async execute(input: DeleteFixedExpenseInput): Promise<void> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_FIXED_EXPENSE_WRITE)
		) {
			throw new ForbiddenError();
		}

		const expense = await this.fixedExpenseRepository.findById(input.id);

		if (!expense) throw new FixedExpenseNotFoundError();
		if (expense.userId !== input.user.id) throw new ForbiddenError();

		await this.fixedExpenseRepository.deactivate(input.id, new Date());
	}
}
