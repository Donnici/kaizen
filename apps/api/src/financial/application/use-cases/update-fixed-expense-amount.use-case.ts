import type { RequestUser } from '@kaizen/utils';

export const UPDATE_FIXED_EXPENSE_AMOUNT_USE_CASE = Symbol(
	'UPDATE_FIXED_EXPENSE_AMOUNT_USE_CASE',
);

export interface UpdateFixedExpenseAmountInput {
	user: RequestUser;
	id: string;
	amount: number;
}

export interface UpdateFixedExpenseAmountOutput {
	id: string;
	name: string;
	amount: number;
	effectiveFromMonth: string;
}

export interface IUpdateFixedExpenseAmountUseCase {
	execute(
		input: UpdateFixedExpenseAmountInput,
	): Promise<UpdateFixedExpenseAmountOutput>;
}
