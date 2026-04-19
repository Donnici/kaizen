import { AppFeature, AppModule, type AuthenticatedUser } from '@kaizen/utils';
import { type ExecutionContext, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { FinancialModule } from '../../src/financial/financial.module';
import { FixedExpenseRecord } from '../../src/financial/infrastructure/schemas/fixed-expense.schema';
import { FixedExpenseRevisionRecord } from '../../src/financial/infrastructure/schemas/fixed-expense-revision.schema';
import { FixedIncomeRecord } from '../../src/financial/infrastructure/schemas/fixed-income.schema';
import { FixedIncomeRevisionRecord } from '../../src/financial/infrastructure/schemas/fixed-income-revision.schema';
import { VariableExpenseRecord } from '../../src/financial/infrastructure/schemas/variable-expense.schema';
import { VariableIncomeRecord } from '../../src/financial/infrastructure/schemas/variable-income.schema';

const mockUser: AuthenticatedUser = {
	anonymous: false,
	id: 'user-id-123',
	name: 'John Doe',
	email: 'john@example.com',
	phone: '+5511999999999',
	modules: [AppModule.FINANCIAL],
	features: [
		AppFeature.FINANCIAL_VARIABLE_INCOME_READ,
		AppFeature.FINANCIAL_VARIABLE_INCOME_WRITE,
	],
};

const mockGuard = {
	canActivate: (ctx: ExecutionContext) => {
		ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
			mockUser;
		return true;
	},
};

describe('Financial - Variable Incomes', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FinancialModule],
			providers: [{ provide: APP_GUARD, useValue: mockGuard }],
		})
			.overrideProvider(getModelToken(VariableIncomeRecord.name))
			.useValue({
				create: jest.fn(),
				find: jest.fn(),
				findOne: jest.fn(),
				deleteOne: jest.fn(),
			})
			.overrideProvider(getModelToken(FixedIncomeRecord.name))
			.useValue({ findOne: jest.fn(), find: jest.fn(), create: jest.fn() })
			.overrideProvider(getModelToken(FixedIncomeRevisionRecord.name))
			.useValue({ findOne: jest.fn(), create: jest.fn() })
			.overrideProvider(getModelToken(FixedExpenseRecord.name))
			.useValue({ findOne: jest.fn(), find: jest.fn(), create: jest.fn() })
			.overrideProvider(getModelToken(FixedExpenseRevisionRecord.name))
			.useValue({ findOne: jest.fn(), create: jest.fn() })
			.overrideProvider(getModelToken(VariableExpenseRecord.name))
			.useValue({
				create: jest.fn(),
				find: jest.fn(),
				findOne: jest.fn(),
				deleteOne: jest.fn(),
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /financial/incomes (type=variable)', () => {
		describe('happy path (201)', () => {
			it.todo(
				'should create variable income returning id, name, amount in cents, category, and date',
			);
			it.todo('should save amount in cents');
			it.todo('should create variable income without a category');
		});

		describe('permissions (403)', () => {
			it.todo(
				'should reject when user does not have FINANCIAL_VARIABLE_INCOME_WRITE',
			);
		});

		describe('body validation (422)', () => {
			it.todo('should reject when name is not provided');
			it.todo('should reject when amount is not a positive integer');
			it.todo('should reject when date is not provided');
			it.todo('should reject when date has an invalid format');
		});
	});

	describe('GET /financial/incomes (type=variable included)', () => {
		describe('happy path (200)', () => {
			it.todo(
				'should return variable incomes combined with fixed, each with type field',
			);
			it.todo('should return variable incomes for a specified month');
			it.todo('should return empty array when user has no variable incomes');
		});

		describe('permissions (403)', () => {
			it.todo(
				'should reject when user does not have FINANCIAL_VARIABLE_INCOME_READ',
			);
		});
	});

	describe('DELETE /financial/incomes/:id', () => {
		describe('happy path (204)', () => {
			it.todo('should delete a variable income owned by the user');
		});

		describe('not found (404)', () => {
			it.todo('should return 404 when variable income does not exist');
		});

		describe('permissions (403)', () => {
			it.todo(
				'should reject when user does not have FINANCIAL_VARIABLE_INCOME_WRITE',
			);
			it.todo('should reject when variable income belongs to a different user');
		});
	});
});
