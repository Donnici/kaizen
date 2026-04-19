import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import {
	type IVariableExpenseRepository,
	VARIABLE_EXPENSE_REPOSITORY,
} from '../../domain/repositories/variable-expense.repository.interface';
import type {
	CreateVariableExpenseInput,
	CreateVariableExpenseOutput,
	ICreateVariableExpenseUseCase,
} from './create-variable-expense.use-case';

@Injectable()
export class CreateVariableExpenseUseCaseImpl
	implements ICreateVariableExpenseUseCase
{
	constructor(
		@Inject(VARIABLE_EXPENSE_REPOSITORY)
		private readonly repository: IVariableExpenseRepository,
	) {}

	async execute(
		input: CreateVariableExpenseInput,
	): Promise<CreateVariableExpenseOutput> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_VARIABLE_EXPENSE_WRITE)
		) {
			throw new ForbiddenError();
		}

		const month = input.date.substring(0, 7);

		const expense = await this.repository.save({
			userId: input.user.id,
			name: input.name,
			amount: input.amount,
			category: input.category,
			date: input.date,
			month,
		});

		return {
			id: expense.id,
			name: expense.name,
			amount: expense.amount,
			category: expense.category,
			date: expense.date,
		};
	}
}
