import type { VariableExpense } from '../entities/variable-expense.entity';

export const VARIABLE_EXPENSE_REPOSITORY = Symbol(
	'VARIABLE_EXPENSE_REPOSITORY',
);

export interface CreateVariableExpenseData {
	userId: string;
	name: string;
	amount: number;
	category?: string;
	date: string;
	month: string;
}

export interface IVariableExpenseRepository {
	save(data: CreateVariableExpenseData): Promise<VariableExpense>;
	findByMonth(userId: string, month: string): Promise<VariableExpense[]>;
	findById(id: string): Promise<VariableExpense | null>;
	delete(id: string): Promise<void>;
}
