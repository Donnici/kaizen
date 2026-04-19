import type { RequestUser } from '@kaizen/utils';

export const LIST_VARIABLE_INCOMES_USE_CASE = Symbol(
	'LIST_VARIABLE_INCOMES_USE_CASE',
);

export interface ListVariableIncomesInput {
	user: RequestUser;
	month?: string;
}

export type ListVariableIncomesOutput = Array<{
	id: string;
	name: string;
	amount: number;
	category?: string;
	date: string;
}>;

export interface IListVariableIncomesUseCase {
	execute(input: ListVariableIncomesInput): Promise<ListVariableIncomesOutput>;
}
