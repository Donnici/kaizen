import { AppFeature, AppModule, type AuthenticatedUser } from '@kaizen/utils';
import { type ExecutionContext, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { getCurrentMonth } from '../../src/financial/domain/utils/get-current-month.util';
import { shiftMonth } from '../../src/financial/domain/utils/shift-month.util';
import { FinancialModule } from '../../src/financial/financial.module';
import { FixedExpenseRecord } from '../../src/financial/infrastructure/schemas/fixed-expense.schema';
import { FixedExpenseRevisionRecord } from '../../src/financial/infrastructure/schemas/fixed-expense-revision.schema';
import { FixedIncomeRecord } from '../../src/financial/infrastructure/schemas/fixed-income.schema';
import { FixedIncomeRevisionRecord } from '../../src/financial/infrastructure/schemas/fixed-income-revision.schema';
import { MonthlySummaryRecord } from '../../src/financial/infrastructure/schemas/monthly-summary.schema';
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
		AppFeature.FINANCIAL_FIXED_EXPENSE_READ,
		AppFeature.FINANCIAL_FIXED_EXPENSE_WRITE,
		AppFeature.FINANCIAL_VARIABLE_EXPENSE_READ,
		AppFeature.FINANCIAL_VARIABLE_EXPENSE_WRITE,
		AppFeature.FINANCIAL_FIXED_INCOME_READ,
		AppFeature.FINANCIAL_FIXED_INCOME_WRITE,
		AppFeature.FINANCIAL_VARIABLE_INCOME_READ,
		AppFeature.FINANCIAL_VARIABLE_INCOME_WRITE,
		AppFeature.FINANCIAL_SUMMARY_READ,
	],
};

const mockGuard = {
	canActivate: (ctx: ExecutionContext) => {
		ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
			mockUser;
		return true;
	},
};

describe('Financial - Summary', () => {
	let app: INestApplication;

	const mockSummaryModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		bulkWrite: jest.fn(),
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FinancialModule],
			providers: [{ provide: APP_GUARD, useValue: mockGuard }],
		})
			.overrideProvider(getModelToken(FixedExpenseRecord.name))
			.useValue({ findOne: jest.fn(), find: jest.fn(), create: jest.fn() })
			.overrideProvider(getModelToken(FixedExpenseRevisionRecord.name))
			.useValue({ findOne: jest.fn(), find: jest.fn(), create: jest.fn() })
			.overrideProvider(getModelToken(VariableExpenseRecord.name))
			.useValue({
				create: jest.fn(),
				find: jest.fn(),
				findOne: jest.fn(),
				deleteOne: jest.fn(),
			})
			.overrideProvider(getModelToken(FixedIncomeRecord.name))
			.useValue({ findOne: jest.fn(), find: jest.fn(), create: jest.fn() })
			.overrideProvider(getModelToken(FixedIncomeRevisionRecord.name))
			.useValue({ findOne: jest.fn(), find: jest.fn(), create: jest.fn() })
			.overrideProvider(getModelToken(VariableIncomeRecord.name))
			.useValue({
				create: jest.fn(),
				find: jest.fn(),
				findOne: jest.fn(),
				deleteOne: jest.fn(),
			})
			.overrideProvider(getModelToken(MonthlySummaryRecord.name))
			.useValue(mockSummaryModel)
			.compile();

		app = module.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('GET /finance/summary', () => {
		describe('happy path (200)', () => {
			it('should return 8 months: previous, current and next 6', async () => {
				mockSummaryModel.find.mockResolvedValueOnce([]);

				const response = await request(app.getHttpServer())
					.get('/finance/summary')
					.expect(200);

				const current = getCurrentMonth();
				const expectedMonths = [
					shiftMonth(current, -1),
					current,
					shiftMonth(current, 1),
					shiftMonth(current, 2),
					shiftMonth(current, 3),
					shiftMonth(current, 4),
					shiftMonth(current, 5),
					shiftMonth(current, 6),
				];

				expect(response.body.months).toHaveLength(8);
				expect(
					response.body.months.map((m: { month: string }) => m.month),
				).toEqual(expectedMonths);
			});

			it('should return zeros for months with no data', async () => {
				mockSummaryModel.find.mockResolvedValueOnce([]);

				const response = await request(app.getHttpServer())
					.get('/finance/summary')
					.expect(200);

				for (const month of response.body.months) {
					expect(month.initialBalance).toBe(0);
					expect(month.totalIncomes).toBe(0);
					expect(month.totalExpenses).toBe(0);
					expect(month.finalBalance).toBe(0);
				}
			});

			it('should return stored summary values for months that have data', async () => {
				const current = getCurrentMonth();
				const storedSummary = {
					_id: { toString: () => 'summary-id-123' },
					userId: 'user-id-123',
					month: current,
					totalIncomes: 500000,
					totalExpenses: 150000,
					initialBalance: 100000,
					finalBalance: 450000,
				};
				mockSummaryModel.find.mockResolvedValueOnce([storedSummary]);

				const response = await request(app.getHttpServer())
					.get('/finance/summary')
					.expect(200);

				const currentMonthData = response.body.months.find(
					(m: { month: string }) => m.month === current,
				);
				expect(currentMonthData).toEqual({
					month: current,
					initialBalance: 100000,
					totalIncomes: 500000,
					totalExpenses: 150000,
					finalBalance: 450000,
				});
			});

			it('should show zero values for months not present in stored data', async () => {
				const current = getCurrentMonth();
				const storedSummary = {
					_id: { toString: () => 'summary-id-123' },
					userId: 'user-id-123',
					month: current,
					totalIncomes: 500000,
					totalExpenses: 150000,
					initialBalance: 100000,
					finalBalance: 450000,
				};
				mockSummaryModel.find.mockResolvedValueOnce([storedSummary]);

				const response = await request(app.getHttpServer())
					.get('/finance/summary')
					.expect(200);

				const prevMonth = response.body.months.find(
					(m: { month: string }) => m.month === shiftMonth(current, -1),
				);
				expect(prevMonth).toEqual({
					month: shiftMonth(current, -1),
					initialBalance: 0,
					totalIncomes: 0,
					totalExpenses: 0,
					finalBalance: 0,
				});
			});
		});

		describe('permissions (403)', () => {
			let guardSpy: jest.SpyInstance;

			beforeEach(() => {
				guardSpy = jest
					.spyOn(mockGuard, 'canActivate')
					.mockImplementation((ctx: ExecutionContext) => {
						ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
							{
								...mockUser,
								features: [],
							};
						return true;
					});
			});

			afterEach(() => {
				guardSpy.mockRestore();
			});

			it('should reject when user lacks FINANCIAL_SUMMARY_READ', async () => {
				const response = await request(app.getHttpServer())
					.get('/finance/summary')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});
	});
});
