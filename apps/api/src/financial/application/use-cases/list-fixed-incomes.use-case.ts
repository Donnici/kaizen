import type { RequestUser } from '@kaizen/utils';

export const LIST_FIXED_INCOMES_USE_CASE = Symbol(
	'LIST_FIXED_INCOMES_USE_CASE',
);

export interface ListFixedIncomesInput {
	user: RequestUser;
	month?: string;
}

export interface FixedIncomeItem {
	id: string;
	name: string;
	amount: number;
	effectiveFromMonth: string;
}

export interface IListFixedIncomesUseCase {
	execute(input: ListFixedIncomesInput): Promise<FixedIncomeItem[]>;
}
