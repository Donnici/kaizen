import type { FixedExpense } from '../entities/fixed-expense.entity';

export const FIXED_EXPENSE_REPOSITORY = Symbol('FIXED_EXPENSE_REPOSITORY');

export interface CreateFixedExpenseData {
	userId: string;
	name: string;
}

export interface IFixedExpenseRepository {
	save(data: CreateFixedExpenseData): Promise<FixedExpense>;
	findById(id: string): Promise<FixedExpense | null>;
	findActiveByUserId(userId: string): Promise<FixedExpense[]>;
}
