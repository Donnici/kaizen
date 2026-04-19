import type { RequestUser } from '@kaizen/utils';

export const LIST_FIXED_EXPENSES_USE_CASE = Symbol(
	'LIST_FIXED_EXPENSES_USE_CASE',
);

export interface ListFixedExpensesInput {
	user: RequestUser;
	month?: string;
}

export interface FixedExpenseItem {
	id: string;
	name: string;
	amount: number;
	effectiveFromMonth: string;
}

export interface IListFixedExpensesUseCase {
	execute(input: ListFixedExpensesInput): Promise<FixedExpenseItem[]>;
}
