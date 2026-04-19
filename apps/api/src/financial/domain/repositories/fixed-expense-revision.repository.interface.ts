import type { FixedExpenseRevision } from '../entities/fixed-expense-revision.entity';

export const FIXED_EXPENSE_REVISION_REPOSITORY = Symbol(
	'FIXED_EXPENSE_REVISION_REPOSITORY',
);

export interface CreateFixedExpenseRevisionData {
	fixedExpenseId: string;
	amount: number;
	effectiveFromMonth: string;
}

export interface IFixedExpenseRevisionRepository {
	save(data: CreateFixedExpenseRevisionData): Promise<FixedExpenseRevision>;
	findLatestForMonth(
		fixedExpenseId: string,
		month: string,
	): Promise<FixedExpenseRevision | null>;
}
