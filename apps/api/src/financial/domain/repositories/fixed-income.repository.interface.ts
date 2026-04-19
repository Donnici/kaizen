import type { FixedIncome } from '../entities/fixed-income.entity';

export const FIXED_INCOME_REPOSITORY = Symbol('FIXED_INCOME_REPOSITORY');

export interface CreateFixedIncomeData {
	userId: string;
	name: string;
}

export interface IFixedIncomeRepository {
	save(data: CreateFixedIncomeData): Promise<FixedIncome>;
	findById(id: string): Promise<FixedIncome | null>;
	findActiveByUserId(userId: string): Promise<FixedIncome[]>;
}
