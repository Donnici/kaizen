import type { FixedIncomeRevision } from '../entities/fixed-income-revision.entity';

export const FIXED_INCOME_REVISION_REPOSITORY = Symbol(
	'FIXED_INCOME_REVISION_REPOSITORY',
);

export interface CreateFixedIncomeRevisionData {
	fixedIncomeId: string;
	amount: number;
	effectiveFromMonth: string;
}

export interface IFixedIncomeRevisionRepository {
	save(data: CreateFixedIncomeRevisionData): Promise<FixedIncomeRevision>;
	findLatestForMonth(
		fixedIncomeId: string,
		month: string,
	): Promise<FixedIncomeRevision | null>;
	findAllByFixedIncomeIds(ids: string[]): Promise<FixedIncomeRevision[]>;
}
