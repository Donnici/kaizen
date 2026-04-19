import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import {
	type IVariableIncomeRepository,
	VARIABLE_INCOME_REPOSITORY,
} from '../../domain/repositories/variable-income.repository.interface';
import type {
	CreateVariableIncomeInput,
	CreateVariableIncomeOutput,
	ICreateVariableIncomeUseCase,
} from './create-variable-income.use-case';

@Injectable()
export class CreateVariableIncomeUseCaseImpl
	implements ICreateVariableIncomeUseCase
{
	constructor(
		@Inject(VARIABLE_INCOME_REPOSITORY)
		private readonly repository: IVariableIncomeRepository,
	) {}

	async execute(
		input: CreateVariableIncomeInput,
	): Promise<CreateVariableIncomeOutput> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_VARIABLE_INCOME_WRITE)
		) {
			throw new ForbiddenError();
		}

		const month = input.date.substring(0, 7);

		const income = await this.repository.save({
			userId: input.user.id,
			name: input.name,
			amount: input.amount,
			category: input.category,
			date: input.date,
			month,
		});

		return {
			id: income.id,
			name: income.name,
			amount: income.amount,
			category: income.category,
			date: income.date,
		};
	}
}
