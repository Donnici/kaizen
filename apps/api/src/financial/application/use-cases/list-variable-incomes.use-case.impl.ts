import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import {
	type IVariableIncomeRepository,
	VARIABLE_INCOME_REPOSITORY,
} from '../../domain/repositories/variable-income.repository.interface';
import { getCurrentMonth } from '../../domain/utils/get-current-month.util';
import type {
	IListVariableIncomesUseCase,
	ListVariableIncomesInput,
	VariableIncomeItem,
} from './list-variable-incomes.use-case';

@Injectable()
export class ListVariableIncomesUseCaseImpl
	implements IListVariableIncomesUseCase
{
	constructor(
		@Inject(VARIABLE_INCOME_REPOSITORY)
		private readonly repository: IVariableIncomeRepository,
	) {}

	async execute(
		input: ListVariableIncomesInput,
	): Promise<VariableIncomeItem[]> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_VARIABLE_INCOME_READ)
		) {
			throw new ForbiddenError();
		}

		const month = input.month ?? getCurrentMonth();
		const incomes = await this.repository.findByMonth(input.user.id, month);

		return incomes.map((income) => ({
			id: income.id,
			name: income.name,
			amount: income.amount,
			category: income.category,
			date: income.date,
		}));
	}
}
