import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../shared/errors/forbidden.error';
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
	CreateFixedIncomeInput,
	CreateFixedIncomeOutput,
	ICreateFixedIncomeUseCase,
} from './create-fixed-income.use-case';

@Injectable()
export class CreateFixedIncomeUseCaseImpl implements ICreateFixedIncomeUseCase {
	constructor(
		@Inject(FIXED_INCOME_REPOSITORY)
		private readonly incomeRepository: IFixedIncomeRepository,
		@Inject(FIXED_INCOME_REVISION_REPOSITORY)
		private readonly revisionRepository: IFixedIncomeRevisionRepository,
	) {}

	async execute(
		input: CreateFixedIncomeInput,
	): Promise<CreateFixedIncomeOutput> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_FIXED_INCOME_WRITE)
		) {
			throw new ForbiddenError();
		}

		const income = await this.incomeRepository.save({
			userId: input.user.id,
			name: input.name,
		});

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
