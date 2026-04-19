import type { RequestUser } from '@kaizen/utils';

export const CREATE_VARIABLE_INCOME_USE_CASE = Symbol(
	'CREATE_VARIABLE_INCOME_USE_CASE',
);

export interface CreateVariableIncomeInput {
	user: RequestUser;
	name: string;
	amount: number;
	category?: string;
	date: string;
}

export interface CreateVariableIncomeOutput {
	id: string;
	name: string;
	amount: number;
	category?: string;
	date: string;
}

export interface ICreateVariableIncomeUseCase {
	execute(
		input: CreateVariableIncomeInput,
	): Promise<CreateVariableIncomeOutput>;
}
