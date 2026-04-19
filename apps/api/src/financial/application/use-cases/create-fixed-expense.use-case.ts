import type { RequestUser } from '@kaizen/utils';

export const CREATE_FIXED_EXPENSE_USE_CASE = Symbol(
	'CREATE_FIXED_EXPENSE_USE_CASE',
);

export interface CreateFixedExpenseInput {
	user: RequestUser;
	name: string;
	amount: number;
}

export interface CreateFixedExpenseOutput {
	id: string;
	name: string;
	amount: number;
	effectiveFromMonth: string;
}

export interface ICreateFixedExpenseUseCase {
	execute(input: CreateFixedExpenseInput): Promise<CreateFixedExpenseOutput>;
}
