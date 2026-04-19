import type { RequestUser } from '@kaizen/utils';

export const UPDATE_FIXED_INCOME_AMOUNT_USE_CASE = Symbol(
	'UPDATE_FIXED_INCOME_AMOUNT_USE_CASE',
);

export interface UpdateFixedIncomeAmountInput {
	user: RequestUser;
	id: string;
	amount: number;
}

export interface UpdateFixedIncomeAmountOutput {
	id: string;
	name: string;
	amount: number;
	effectiveFromMonth: string;
}

export interface IUpdateFixedIncomeAmountUseCase {
	execute(
		input: UpdateFixedIncomeAmountInput,
	): Promise<UpdateFixedIncomeAmountOutput>;
}
