import type { RequestUser } from '@kaizen/utils';

export const DELETE_FIXED_INCOME_USE_CASE = Symbol(
	'DELETE_FIXED_INCOME_USE_CASE',
);

export interface DeleteFixedIncomeInput {
	user: RequestUser;
	id: string;
}

export interface IDeleteFixedIncomeUseCase {
	execute(input: DeleteFixedIncomeInput): Promise<void>;
}
