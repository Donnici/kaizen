import type { RequestUser } from '@kaizen/utils';

export const LIST_VARIABLE_EXPENSES_USE_CASE = Symbol(
	'LIST_VARIABLE_EXPENSES_USE_CASE',
);

export interface ListVariableExpensesInput {
	user: RequestUser;
	month?: string;
}

export type ListVariableExpensesOutput = Array<{
	id: string;
	name: string;
	amount: number;
	category?: string;
	date: string;
}>;

export interface IListVariableExpensesUseCase {
	execute(
		input: ListVariableExpensesInput,
	): Promise<ListVariableExpensesOutput>;
}
