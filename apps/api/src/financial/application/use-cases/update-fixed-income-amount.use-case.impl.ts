import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
import { FixedIncomeNotFoundError } from '../../domain/errors/fixed-income-not-found.error';
import {
	FIXED_INCOME_REPOSITORY,
	type IFixedIncomeRepository,
} from '../../domain/repositories/fixed-income.repository.interface';
import {
	FIXED_INCOME_REVISION_REPOSITORY,
	type IFixedIncomeRevisionRepository,
} from '../../domain/repositories/fixed-income-revision.repository.interface';
import { getCurrentMonth } from '../../domain/utils/get-current-month.util';
import type {
	IUpdateFixedIncomeAmountUseCase,
	UpdateFixedIncomeAmountInput,
	UpdateFixedIncomeAmountOutput,
} from './update-fixed-income-amount.use-case';

@Injectable()
export class UpdateFixedIncomeAmountUseCaseImpl
	implements IUpdateFixedIncomeAmountUseCase
{
	constructor(
		@Inject(FIXED_INCOME_REPOSITORY)
		private readonly fixedIncomeRepository: IFixedIncomeRepository,
		@Inject(FIXED_INCOME_REVISION_REPOSITORY)
		private readonly revisionRepository: IFixedIncomeRevisionRepository,
	) {}

	async execute(
		input: UpdateFixedIncomeAmountInput,
	): Promise<UpdateFixedIncomeAmountOutput> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_FIXED_INCOME_WRITE)
		) {
			throw new ForbiddenError();
		}

		const income = await this.fixedIncomeRepository.findById(input.id);

		if (!income) throw new FixedIncomeNotFoundError();
		if (income.userId !== input.user.id) throw new ForbiddenError();

		const revision = await this.revisionRepository.save({
			fixedIncomeId: income.id,
			amount: input.amount,
			effectiveFromMonth: getCurrentMonth(),
		});

		return {
			id: income.id,
			name: income.name,
			amount: revision.amount,
			effectiveFromMonth: revision.effectiveFromMonth,
		};
	}
}
