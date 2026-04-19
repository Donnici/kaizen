import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import { VariableIncomeNotFoundError } from '../../domain/errors/variable-income-not-found.error';
import {
	type IVariableIncomeRepository,
	VARIABLE_INCOME_REPOSITORY,
} from '../../domain/repositories/variable-income.repository.interface';
import type {
	DeleteVariableIncomeInput,
	IDeleteVariableIncomeUseCase,
} from './delete-variable-income.use-case';

@Injectable()
export class DeleteVariableIncomeUseCaseImpl
	implements IDeleteVariableIncomeUseCase
{
	constructor(
		@Inject(VARIABLE_INCOME_REPOSITORY)
		private readonly repository: IVariableIncomeRepository,
	) {}

	async execute(input: DeleteVariableIncomeInput): Promise<void> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_VARIABLE_INCOME_WRITE)
		) {
			throw new ForbiddenError();
		}

		const income = await this.repository.findById(input.id);

		if (!income) throw new VariableIncomeNotFoundError();
		if (income.userId !== input.user.id) throw new ForbiddenError();

		await this.repository.delete(input.id);
	}
}
