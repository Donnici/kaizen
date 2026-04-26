import { AppFeature, hasFeature } from '@kaizen/utils';
import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../../shared/errors/forbidden.error';
import { FixedIncomeNotFoundError } from '../../../domain/errors/fixed-income-not-found.error';
import {
	FIXED_INCOME_REPOSITORY,
	type IFixedIncomeRepository,
} from '../../../domain/repositories/fixed-income.repository.interface';
import type {
	DeleteFixedIncomeInput,
	IDeleteFixedIncomeUseCase,
} from './delete-fixed-income.use-case';

@Injectable()
export class DeleteFixedIncomeUseCaseImpl implements IDeleteFixedIncomeUseCase {
	constructor(
		@Inject(FIXED_INCOME_REPOSITORY)
		private readonly fixedIncomeRepository: IFixedIncomeRepository,
	) {}

	async execute(input: DeleteFixedIncomeInput): Promise<void> {
		if (
			input.user.anonymous ||
			!hasFeature(input.user, AppFeature.FINANCIAL_FIXED_INCOME_WRITE)
		) {
			throw new ForbiddenError();
		}

		const income = await this.fixedIncomeRepository.findById(input.id);

		if (!income) throw new FixedIncomeNotFoundError();
		if (income.userId !== input.user.id) throw new ForbiddenError();

		await this.fixedIncomeRepository.deactivate(input.id, new Date());
	}
}
