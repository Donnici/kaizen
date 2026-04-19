import type { RequestUser } from '@kaizen/utils';

export const DELETE_VARIABLE_INCOME_USE_CASE = Symbol(
	'DELETE_VARIABLE_INCOME_USE_CASE',
);

export interface DeleteVariableIncomeInput {
	user: RequestUser;
	id: string;
}

export interface IDeleteVariableIncomeUseCase {
	execute(input: DeleteVariableIncomeInput): Promise<void>;
}
