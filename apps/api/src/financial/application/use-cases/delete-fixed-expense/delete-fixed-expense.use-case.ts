import type { RequestUser } from '@kaizen/utils';

export const DELETE_FIXED_EXPENSE_USE_CASE = Symbol(
	'DELETE_FIXED_EXPENSE_USE_CASE',
);

export interface DeleteFixedExpenseInput {
	user: RequestUser;
	id: string;
}

export interface IDeleteFixedExpenseUseCase {
	execute(input: DeleteFixedExpenseInput): Promise<void>;
}
