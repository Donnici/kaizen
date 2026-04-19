import { Inject, Injectable } from '@nestjs/common';
import { AppFeature, hasFeature } from '@kaizen/utils';
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
	CreateFixedExpenseInput,
	CreateFixedExpenseOutput,
	ICreateFixedExpenseUseCase,
} from './create-fixed-expense.use-case';

@Injectable()
export class CreateFixedExpenseUseCaseImpl
	implements ICreateFixedExpenseUseCase
{
	constructor(
		@Inject(FIXED_EXPENSE_REPOSITORY)
		private readonly fixedExpenseRepository: IFixedExpenseRepository,
		@Inject(FIXED_EXPENSE_REVISION_REPOSITORY)
		private readonly revisionRepository: IFixedExpenseRevisionRepository,
	) {}

	async execute(
		input: CreateFixedExpenseInput,
	): Promise<CreateFixedExpenseOutput> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_FIXED_EXPENSE_WRITE)
		) {
			throw new ForbiddenError();
		}

		const expense = await this.fixedExpenseRepository.save({
			userId: input.user.id,
			name: input.name,
		});

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
