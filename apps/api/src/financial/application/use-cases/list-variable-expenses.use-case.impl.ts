import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import {
	type IVariableExpenseRepository,
	VARIABLE_EXPENSE_REPOSITORY,
} from '../../domain/repositories/variable-expense.repository.interface';
import { getCurrentMonth } from '../../domain/utils/get-current-month.util';
import type {
	IListVariableExpensesUseCase,
	ListVariableExpensesInput,
	ListVariableExpensesOutput,
} from './list-variable-expenses.use-case';

@Injectable()
export class ListVariableExpensesUseCaseImpl
	implements IListVariableExpensesUseCase
{
	constructor(
		@Inject(VARIABLE_EXPENSE_REPOSITORY)
		private readonly repository: IVariableExpenseRepository,
	) {}

	async execute(
		input: ListVariableExpensesInput,
	): Promise<ListVariableExpensesOutput> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_VARIABLE_EXPENSE_READ)
		) {
			throw new ForbiddenError();
		}

		const month = input.month ?? getCurrentMonth();
		const expenses = await this.repository.findByMonth(input.user.id, month);

		return expenses.map((expense) => ({
			id: expense.id,
			name: expense.name,
			amount: expense.amount,
			category: expense.category,
			date: expense.date,
		}));
	}
}
