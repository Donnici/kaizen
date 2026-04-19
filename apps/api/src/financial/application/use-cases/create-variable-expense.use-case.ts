import type { RequestUser } from '@kaizen/utils';

export const CREATE_VARIABLE_EXPENSE_USE_CASE = Symbol(
	'CREATE_VARIABLE_EXPENSE_USE_CASE',
);

export interface CreateVariableExpenseInput {
	user: RequestUser;
	name: string;
	amount: number;
	category?: string;
	date: string;
}

export interface CreateVariableExpenseOutput {
	id: string;
	name: string;
	amount: number;
	category?: string;
	date: string;
}

export interface ICreateVariableExpenseUseCase {
	execute(
		input: CreateVariableExpenseInput,
	): Promise<CreateVariableExpenseOutput>;
}
