import type { RequestUser } from '@kaizen/utils';

export const CREATE_FIXED_INCOME_USE_CASE = Symbol(
	'CREATE_FIXED_INCOME_USE_CASE',
);

export interface CreateFixedIncomeInput {
	user: RequestUser;
	name: string;
	amount: number;
}

export interface CreateFixedIncomeOutput {
	id: string;
	name: string;
	amount: number;
	effectiveFromMonth: string;
}

export interface ICreateFixedIncomeUseCase {
	execute(input: CreateFixedIncomeInput): Promise<CreateFixedIncomeOutput>;
}
