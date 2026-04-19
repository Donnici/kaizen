import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import { VariableExpenseNotFoundError } from '../../domain/errors/variable-expense-not-found.error';
import {
	type IVariableExpenseRepository,
	VARIABLE_EXPENSE_REPOSITORY,
} from '../../domain/repositories/variable-expense.repository.interface';
import type {
	DeleteVariableExpenseInput,
	IDeleteVariableExpenseUseCase,
} from './delete-variable-expense.use-case';

@Injectable()
export class DeleteVariableExpenseUseCaseImpl
	implements IDeleteVariableExpenseUseCase
{
	constructor(
		@Inject(VARIABLE_EXPENSE_REPOSITORY)
		private readonly repository: IVariableExpenseRepository,
	) {}

	async execute(input: DeleteVariableExpenseInput): Promise<void> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_VARIABLE_EXPENSE_WRITE)
		) {
			throw new ForbiddenError();
		}

		const expense = await this.repository.findById(input.id);

		if (!expense) {
			throw new VariableExpenseNotFoundError();
		}

		if (expense.userId !== input.user.id) {
			throw new ForbiddenError();
		}

		await this.repository.delete(input.id);
	}
}
