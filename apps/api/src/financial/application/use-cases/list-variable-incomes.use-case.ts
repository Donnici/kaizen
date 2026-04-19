import type { RequestUser } from '@kaizen/utils';

export const LIST_VARIABLE_INCOMES_USE_CASE = Symbol(
	'LIST_VARIABLE_INCOMES_USE_CASE',
);

export interface ListVariableIncomesInput {
	user: RequestUser;
	month?: string;
}

export interface VariableIncomeItem {
	id: string;
	name: string;
	amount: number;
	category: string | undefined;
	date: string;
}

export interface IListVariableIncomesUseCase {
	execute(input: ListVariableIncomesInput): Promise<VariableIncomeItem[]>;
}
