import type { VariableIncome } from '../entities/variable-income.entity';

export const VARIABLE_INCOME_REPOSITORY = Symbol('VARIABLE_INCOME_REPOSITORY');

export interface CreateVariableIncomeData {
	userId: string;
	name: string;
	amount: number;
	category?: string;
	date: string;
	month: string;
}

export interface IVariableIncomeRepository {
	save(data: CreateVariableIncomeData): Promise<VariableIncome>;
	findByMonth(userId: string, month: string): Promise<VariableIncome[]>;
	findById(id: string): Promise<VariableIncome | null>;
	delete(id: string): Promise<void>;
}
