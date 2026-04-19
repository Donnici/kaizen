import type { RequestUser } from '@kaizen/utils';

export const DELETE_VARIABLE_EXPENSE_USE_CASE = Symbol(
	'DELETE_VARIABLE_EXPENSE_USE_CASE',
);

export interface DeleteVariableExpenseInput {
	user: RequestUser;
	id: string;
}

export interface IDeleteVariableExpenseUseCase {
	execute(input: DeleteVariableExpenseInput): Promise<void>;
}
