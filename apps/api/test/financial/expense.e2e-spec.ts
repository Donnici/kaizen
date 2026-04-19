import { AppFeature, AppModule, type AuthenticatedUser } from '@kaizen/utils';
import { type ExecutionContext, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { getCurrentMonth } from '../../src/financial/domain/utils/get-current-month.util';
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

describe('Financial - Expenses (unified)', () => {
	let app: INestApplication;

	const mockExpenseModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
	};
	const mockRevisionModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
	};
	const mockVariableExpenseModel = {
		create: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		deleteOne: jest.fn(),
	};
	const mockFixedIncomeModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
	};
	const mockIncomeRevisionModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
	};
	const mockVariableIncomeModel = {
		create: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		deleteOne: jest.fn(),
	};
	const mockSummaryModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		bulkWrite: jest.fn(),
	};

	const mockExpenseDoc = {
		_id: { toString: () => 'expense-id-123' },
		userId: 'user-id-123',
		name: 'Aluguel',
		isActive: true,
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
	};

	const mockRevisionDoc = {
		_id: { toString: () => 'revision-id-123' },
		fixedExpenseId: 'expense-id-123',
		amount: 100000,
		effectiveFromMonth: getCurrentMonth(),
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
	};

	const mockVariableExpenseDoc = {
		_id: { toString: () => 'variable-expense-id-123' },
		userId: 'user-id-123',
		name: 'Jantar fora',
		amount: 8500,
		category: 'Alimentação',
		date: '2026-04-15',
		month: '2026-04',
		createdAt: new Date('2026-04-15T00:00:00.000Z'),
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FinancialModule],
			providers: [{ provide: APP_GUARD, useValue: mockGuard }],
		})
			.overrideProvider(getModelToken(FixedExpenseRecord.name))
			.useValue(mockExpenseModel)
			.overrideProvider(getModelToken(FixedExpenseRevisionRecord.name))
			.useValue(mockRevisionModel)
			.overrideProvider(getModelToken(VariableExpenseRecord.name))
			.useValue(mockVariableExpenseModel)
			.overrideProvider(getModelToken(FixedIncomeRecord.name))
			.useValue(mockFixedIncomeModel)
			.overrideProvider(getModelToken(FixedIncomeRevisionRecord.name))
			.useValue(mockIncomeRevisionModel)
			.overrideProvider(getModelToken(VariableIncomeRecord.name))
			.useValue(mockVariableIncomeModel)
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
		mockExpenseModel.find.mockResolvedValue([]);
		mockRevisionModel.find.mockResolvedValue([]);
		mockFixedIncomeModel.find.mockResolvedValue([]);
		mockIncomeRevisionModel.find.mockResolvedValue([]);
		mockVariableExpenseModel.find.mockResolvedValue([]);
		mockVariableIncomeModel.find.mockResolvedValue([]);
		mockSummaryModel.findOne.mockResolvedValue(null);
		mockSummaryModel.bulkWrite.mockResolvedValue({});
	});

	describe('POST /finance/expenses', () => {
		describe('fixed expense — happy path (201)', () => {
			it('should create fixed expense with type field in response', async () => {
				mockExpenseModel.create.mockResolvedValueOnce(mockExpenseDoc);
				mockRevisionModel.create.mockResolvedValueOnce(mockRevisionDoc);

				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({ type: 'fixed', name: 'Aluguel', amount: 100000 })
					.expect(201);

				expect(response.body).toEqual({
					type: 'fixed',
					id: 'expense-id-123',
					name: 'Aluguel',
					amount: 100000,
					effectiveFromMonth: expect.stringMatching(/^\d{4}-(0[1-9]|1[0-2])$/),
				});
			});

			it('should save fixed expense amount in cents', async () => {
				mockExpenseModel.create.mockResolvedValueOnce(mockExpenseDoc);
				mockRevisionModel.create.mockResolvedValueOnce(mockRevisionDoc);

				await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({ type: 'fixed', name: 'Aluguel', amount: 100000 })
					.expect(201);

				expect(mockRevisionModel.create).toHaveBeenCalledWith(
					expect.objectContaining({ amount: 100000 }),
				);
			});
		});

		describe('variable expense — happy path (201)', () => {
			it('should create variable expense with type field in response', async () => {
				mockVariableExpenseModel.create.mockResolvedValueOnce(
					mockVariableExpenseDoc,
				);

				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({
						type: 'variable',
						name: 'Jantar fora',
						amount: 8500,
						category: 'Alimentação',
						date: '2026-04-15',
					})
					.expect(201);

				expect(response.body).toEqual({
					type: 'variable',
					id: 'variable-expense-id-123',
					name: 'Jantar fora',
					amount: 8500,
					category: 'Alimentação',
					date: '2026-04-15',
				});
			});

			it('should create variable expense without category', async () => {
				mockVariableExpenseModel.create.mockResolvedValueOnce({
					...mockVariableExpenseDoc,
					category: undefined,
				});

				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({
						type: 'variable',
						name: 'Jantar fora',
						amount: 8500,
						date: '2026-04-15',
					})
					.expect(201);

				expect(response.body.category).toBeUndefined();
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

			it('should reject fixed expense when user lacks FINANCIAL_FIXED_EXPENSE_WRITE', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({ type: 'fixed', name: 'Aluguel', amount: 100000 })
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});

			it('should reject variable expense when user lacks FINANCIAL_VARIABLE_EXPENSE_WRITE', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({
						type: 'variable',
						name: 'Jantar fora',
						amount: 8500,
						date: '2026-04-15',
					})
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('body validation (422)', () => {
			it('should reject when type is missing', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({ name: 'Aluguel', amount: 100000 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'type' })]),
				);
			});

			it('should reject fixed expense when name is missing', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({ type: 'fixed', amount: 100000 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
				);
			});

			it('should reject fixed expense when amount is not a positive integer', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({ type: 'fixed', name: 'Aluguel', amount: -100 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ field: 'amount' }),
					]),
				);
			});

			it('should reject variable expense when date is missing', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({ type: 'variable', name: 'Jantar', amount: 8500 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'date' })]),
				);
			});

			it('should reject variable expense when date has invalid format', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/expenses')
					.send({
						type: 'variable',
						name: 'Jantar',
						amount: 8500,
						date: '15/04/2026',
					})
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'date' })]),
				);
			});
		});
	});

	describe('GET /finance/expenses', () => {
		describe('happy path (200)', () => {
			it('should return fixed and variable expenses with type field', async () => {
				mockExpenseModel.find.mockResolvedValueOnce([mockExpenseDoc]);
				mockRevisionModel.findOne.mockResolvedValueOnce(mockRevisionDoc);
				mockVariableExpenseModel.find.mockResolvedValueOnce([
					mockVariableExpenseDoc,
				]);

				const response = await request(app.getHttpServer())
					.get('/finance/expenses')
					.expect(200);

				expect(response.body).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ type: 'fixed', id: 'expense-id-123' }),
						expect.objectContaining({
							type: 'variable',
							id: 'variable-expense-id-123',
						}),
					]),
				);
			});

			it('should return empty array when user has no expenses', async () => {
				mockExpenseModel.find.mockResolvedValueOnce([]);
				mockVariableExpenseModel.find.mockResolvedValueOnce([]);

				const response = await request(app.getHttpServer())
					.get('/finance/expenses')
					.expect(200);

				expect(response.body).toEqual([]);
			});

			it('should not include fixed expense whose first revision is after the queried month', async () => {
				mockExpenseModel.find.mockResolvedValueOnce([mockExpenseDoc]);
				mockRevisionModel.findOne.mockResolvedValueOnce(null);
				mockVariableExpenseModel.find.mockResolvedValueOnce([]);

				const response = await request(app.getHttpServer())
					.get('/finance/expenses?month=2025-12')
					.expect(200);

				expect(response.body).toEqual([]);
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

			it('should reject when user lacks read permissions', async () => {
				const response = await request(app.getHttpServer())
					.get('/finance/expenses')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('query validation (422)', () => {
			it('should reject when month query param has invalid format', async () => {
				const response = await request(app.getHttpServer())
					.get('/finance/expenses?month=april-2026')
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'month' })]),
				);
			});
		});
	});

	describe('PATCH /finance/expenses/:id', () => {
		describe('happy path (200)', () => {
			it('should update fixed expense amount and return with type field', async () => {
				const updatedRevision = {
					...mockRevisionDoc,
					amount: 150000,
					effectiveFromMonth: getCurrentMonth(),
				};
				mockExpenseModel.findOne.mockResolvedValueOnce(mockExpenseDoc);
				mockRevisionModel.create.mockResolvedValueOnce(updatedRevision);

				const response = await request(app.getHttpServer())
					.patch('/finance/expenses/expense-id-123')
					.send({ amount: 150000 })
					.expect(200);

				expect(response.body).toEqual({
					type: 'fixed',
					id: 'expense-id-123',
					name: 'Aluguel',
					amount: 150000,
					effectiveFromMonth: getCurrentMonth(),
				});
			});
		});

		describe('not found (404)', () => {
			it('should return 404 when fixed expense does not exist', async () => {
				mockExpenseModel.findOne.mockResolvedValueOnce(null);

				const response = await request(app.getHttpServer())
					.patch('/finance/expenses/nonexistent-id')
					.send({ amount: 150000 })
					.expect(404);

				expect(response.body.statusCode).toBe(404);
			});
		});

		describe('permissions (403)', () => {
			it('should reject when expense belongs to a different user', async () => {
				const guardSpy = jest
					.spyOn(mockGuard, 'canActivate')
					.mockImplementationOnce((ctx: ExecutionContext) => {
						ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
							{
								...mockUser,
								id: 'other-user-id',
							};
						return true;
					});

				mockExpenseModel.findOne.mockResolvedValueOnce(mockExpenseDoc);

				const response = await request(app.getHttpServer())
					.patch('/finance/expenses/expense-id-123')
					.send({ amount: 150000 })
					.expect(403);

				expect(response.body.statusCode).toBe(403);
				guardSpy.mockRestore();
			});
		});
	});

	describe('DELETE /finance/expenses/:id', () => {
		describe('happy path (204)', () => {
			it('should delete variable expense owned by the user', async () => {
				mockVariableExpenseModel.findOne.mockResolvedValueOnce(
					mockVariableExpenseDoc,
				);
				mockVariableExpenseModel.deleteOne.mockResolvedValueOnce({
					deletedCount: 1,
				});

				await request(app.getHttpServer())
					.delete('/finance/expenses/variable-expense-id-123')
					.expect(204);

				expect(mockVariableExpenseModel.deleteOne).toHaveBeenCalledWith({
					_id: 'variable-expense-id-123',
				});
			});
		});

		describe('not found (404)', () => {
			it('should return 404 when variable expense does not exist', async () => {
				mockVariableExpenseModel.findOne.mockResolvedValueOnce(null);

				const response = await request(app.getHttpServer())
					.delete('/finance/expenses/nonexistent-id')
					.expect(404);

				expect(response.body.statusCode).toBe(404);
			});
		});

		describe('permissions (403)', () => {
			it('should reject when variable expense belongs to a different user', async () => {
				const guardSpy = jest
					.spyOn(mockGuard, 'canActivate')
					.mockImplementationOnce((ctx: ExecutionContext) => {
						ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
							{
								...mockUser,
								id: 'other-user-id',
							};
						return true;
					});

				mockVariableExpenseModel.findOne.mockResolvedValueOnce(
					mockVariableExpenseDoc,
				);

				const response = await request(app.getHttpServer())
					.delete('/finance/expenses/variable-expense-id-123')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
				guardSpy.mockRestore();
			});
		});
	});
});
