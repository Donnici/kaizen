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
import { VariableExpenseRecord } from '../../src/financial/infrastructure/schemas/variable-expense.schema';

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
	],
};

const mockGuard = {
	canActivate: (ctx: ExecutionContext) => {
		ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
			mockUser;
		return true;
	},
};

describe('Financial - Expenses', () => {
	let app: INestApplication;

	const mockFixedExpenseModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
	};
	const mockFixedExpenseRevisionModel = {
		findOne: jest.fn(),
		create: jest.fn(),
	};
	const mockVariableExpenseModel = {
		create: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		deleteOne: jest.fn(),
	};

	const mockFixedExpenseDoc = {
		_id: { toString: () => 'expense-id-123' },
		userId: 'user-id-123',
		name: 'Aluguel',
		isActive: true,
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
	};
	const mockFixedRevisionDoc = {
		_id: { toString: () => 'revision-id-123' },
		fixedExpenseId: 'expense-id-123',
		amount: 100000,
		effectiveFromMonth: getCurrentMonth(),
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
	};
	const mockVariableExpenseDoc = {
		_id: { toString: () => 'variable-id-123' },
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
			.useValue(mockFixedExpenseModel)
			.overrideProvider(getModelToken(FixedExpenseRevisionRecord.name))
			.useValue(mockFixedExpenseRevisionModel)
			.overrideProvider(getModelToken(VariableExpenseRecord.name))
			.useValue(mockVariableExpenseModel)
			.overrideProvider(getModelToken(FixedIncomeRecord.name))
			.useValue({ findOne: jest.fn(), find: jest.fn(), create: jest.fn() })
			.overrideProvider(getModelToken(FixedIncomeRevisionRecord.name))
			.useValue({ findOne: jest.fn(), create: jest.fn() })
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

	describe('POST /financial/expenses', () => {
		describe('fixed (type=fixed)', () => {
			describe('happy path (201)', () => {
				it('should create fixed expense returning id, name, amount, effectiveFromMonth, type', async () => {
					mockFixedExpenseModel.create.mockResolvedValueOnce(
						mockFixedExpenseDoc,
					);
					mockFixedExpenseRevisionModel.create.mockResolvedValueOnce(
						mockFixedRevisionDoc,
					);

					const response = await request(app.getHttpServer())
						.post('/financial/expenses')
						.send({ type: 'fixed', name: 'Aluguel', amount: 100000 })
						.expect(201);

					expect(response.body).toEqual({
						id: 'expense-id-123',
						name: 'Aluguel',
						amount: 100000,
						effectiveFromMonth: expect.stringMatching(
							/^\d{4}-(0[1-9]|1[0-2])$/,
						),
					});
				});

				it('should save amount in cents', async () => {
					mockFixedExpenseModel.create.mockResolvedValueOnce(
						mockFixedExpenseDoc,
					);
					mockFixedExpenseRevisionModel.create.mockResolvedValueOnce(
						mockFixedRevisionDoc,
					);

					await request(app.getHttpServer())
						.post('/financial/expenses')
						.send({ type: 'fixed', name: 'Aluguel', amount: 100000 })
						.expect(201);

					expect(mockFixedExpenseRevisionModel.create).toHaveBeenCalledWith(
						expect.objectContaining({ amount: 100000 }),
					);
				});
			});

			describe('permissions (403)', () => {
				let guardSpy: jest.SpyInstance;

				beforeEach(() => {
					guardSpy = jest
						.spyOn(mockGuard, 'canActivate')
						.mockImplementation((ctx: ExecutionContext) => {
							ctx
								.switchToHttp()
								.getRequest<{ user: AuthenticatedUser }>().user = {
								...mockUser,
								features: [],
							};
							return true;
						});
				});

				afterEach(() => {
					guardSpy.mockRestore();
				});

				it('should reject when user lacks FINANCIAL_FIXED_EXPENSE_WRITE', async () => {
					const response = await request(app.getHttpServer())
						.post('/financial/expenses')
						.send({ type: 'fixed', name: 'Aluguel', amount: 100000 })
						.expect(403);

					expect(response.body.statusCode).toBe(403);
				});
			});

			describe('body validation (422)', () => {
				it('should reject when name is not provided', async () => {
					const response = await request(app.getHttpServer())
						.post('/financial/expenses')
						.send({ type: 'fixed', amount: 100000 })
						.expect(422);

					expect(response.body.message).toEqual(
						expect.arrayContaining([
							expect.objectContaining({ field: 'name' }),
						]),
					);
				});

				it('should reject when amount is not a positive integer', async () => {
					const response = await request(app.getHttpServer())
						.post('/financial/expenses')
						.send({ type: 'fixed', name: 'Aluguel', amount: -1 })
						.expect(422);

					expect(response.body.message).toEqual(
						expect.arrayContaining([
							expect.objectContaining({ field: 'amount' }),
						]),
					);
				});
			});
		});

		describe('variable (type=variable)', () => {
			describe('happy path (201)', () => {
				it('should create variable expense returning id, name, amount, category, date, type', async () => {
					mockVariableExpenseModel.create.mockResolvedValueOnce(
						mockVariableExpenseDoc,
					);

					const response = await request(app.getHttpServer())
						.post('/financial/expenses')
						.send({
							type: 'variable',
							name: 'Jantar fora',
							amount: 8500,
							category: 'Alimentação',
							date: '2026-04-15',
						})
						.expect(201);

					expect(response.body).toEqual({
						id: 'variable-id-123',
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
						.post('/financial/expenses')
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
							ctx
								.switchToHttp()
								.getRequest<{ user: AuthenticatedUser }>().user = {
								...mockUser,
								features: [],
							};
							return true;
						});
				});

				afterEach(() => {
					guardSpy.mockRestore();
				});

				it('should reject when user lacks FINANCIAL_VARIABLE_EXPENSE_WRITE', async () => {
					const response = await request(app.getHttpServer())
						.post('/financial/expenses')
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
				it('should reject when date is not provided', async () => {
					const response = await request(app.getHttpServer())
						.post('/financial/expenses')
						.send({ type: 'variable', name: 'Jantar fora', amount: 8500 })
						.expect(422);

					expect(response.body.message).toEqual(
						expect.arrayContaining([
							expect.objectContaining({ field: 'date' }),
						]),
					);
				});

				it('should reject when date has invalid format', async () => {
					const response = await request(app.getHttpServer())
						.post('/financial/expenses')
						.send({
							type: 'variable',
							name: 'Jantar fora',
							amount: 8500,
							date: '15/04/2026',
						})
						.expect(422);

					expect(response.body.message).toEqual(
						expect.arrayContaining([
							expect.objectContaining({ field: 'date' }),
						]),
					);
				});
			});
		});

		describe('type validation (422)', () => {
			it('should reject when type is not provided', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/expenses')
					.send({ name: 'Aluguel', amount: 100000 })
					.expect(422);

				expect(response.body.statusCode).toBe(422);
			});

			it('should reject when type is invalid', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/expenses')
					.send({ type: 'unknown', name: 'Aluguel', amount: 100000 })
					.expect(422);

				expect(response.body.statusCode).toBe(422);
			});
		});
	});

	describe('GET /financial/expenses', () => {
		describe('happy path (200)', () => {
			it('should return fixed and variable expenses combined with type field', async () => {
				mockFixedExpenseModel.find.mockResolvedValueOnce([mockFixedExpenseDoc]);
				mockFixedExpenseRevisionModel.findOne.mockResolvedValueOnce(
					mockFixedRevisionDoc,
				);
				mockVariableExpenseModel.find.mockResolvedValueOnce([
					mockVariableExpenseDoc,
				]);

				const response = await request(app.getHttpServer())
					.get('/financial/expenses')
					.expect(200);

				expect(response.body).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ type: 'fixed', name: 'Aluguel' }),
						expect.objectContaining({ type: 'variable', name: 'Jantar fora' }),
					]),
				);
			});

			it('should return expenses for a specified month', async () => {
				const revisionForJan = {
					...mockFixedRevisionDoc,
					amount: 90000,
					effectiveFromMonth: '2026-01',
				};
				const variableForJan = {
					...mockVariableExpenseDoc,
					date: '2026-01-10',
					month: '2026-01',
				};
				mockFixedExpenseModel.find.mockResolvedValueOnce([mockFixedExpenseDoc]);
				mockFixedExpenseRevisionModel.findOne.mockResolvedValueOnce(
					revisionForJan,
				);
				mockVariableExpenseModel.find.mockResolvedValueOnce([variableForJan]);

				const response = await request(app.getHttpServer())
					.get('/financial/expenses?month=2026-01')
					.expect(200);

				expect(response.body).toHaveLength(2);
				expect(response.body[0].type).toBe('fixed');
				expect(response.body[1].type).toBe('variable');
			});

			it('should return empty array when user has no expenses', async () => {
				mockFixedExpenseModel.find.mockResolvedValueOnce([]);
				mockVariableExpenseModel.find.mockResolvedValueOnce([]);

				const response = await request(app.getHttpServer())
					.get('/financial/expenses')
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
							{ ...mockUser, features: [] };
						return true;
					});
			});

			afterEach(() => {
				guardSpy.mockRestore();
			});

			it('should reject when user lacks FINANCIAL_FIXED_EXPENSE_READ', async () => {
				const response = await request(app.getHttpServer())
					.get('/financial/expenses')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('query validation (422)', () => {
			it('should reject when month has invalid format', async () => {
				const response = await request(app.getHttpServer())
					.get('/financial/expenses?month=april-2026')
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'month' })]),
				);
			});
		});
	});

	describe('PATCH /financial/expenses/:id', () => {
		describe('happy path (200)', () => {
			it('should update fixed expense amount creating a new revision', async () => {
				const updatedRevision = {
					...mockFixedRevisionDoc,
					amount: 150000,
					effectiveFromMonth: getCurrentMonth(),
				};
				mockFixedExpenseModel.findOne.mockResolvedValueOnce(
					mockFixedExpenseDoc,
				);
				mockFixedExpenseRevisionModel.create.mockResolvedValueOnce(
					updatedRevision,
				);

				const response = await request(app.getHttpServer())
					.patch('/financial/expenses/expense-id-123')
					.send({ amount: 150000 })
					.expect(200);

				expect(response.body).toEqual({
					id: 'expense-id-123',
					name: 'Aluguel',
					amount: 150000,
					effectiveFromMonth: getCurrentMonth(),
				});
			});
		});

		describe('not found (404)', () => {
			it('should return 404 when fixed expense does not exist', async () => {
				mockFixedExpenseModel.findOne.mockResolvedValueOnce(null);

				await request(app.getHttpServer())
					.patch('/financial/expenses/nonexistent-id')
					.send({ amount: 150000 })
					.expect(404);
			});
		});

		describe('permissions (403)', () => {
			it('should reject when fixed expense belongs to a different user', async () => {
				const guardSpy = jest
					.spyOn(mockGuard, 'canActivate')
					.mockImplementation((ctx: ExecutionContext) => {
						ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
							{ ...mockUser, id: 'other-user-id' };
						return true;
					});

				mockFixedExpenseModel.findOne.mockResolvedValueOnce(
					mockFixedExpenseDoc,
				);

				await request(app.getHttpServer())
					.patch('/financial/expenses/expense-id-123')
					.send({ amount: 150000 })
					.expect(403);

				guardSpy.mockRestore();
			});
		});
	});

	describe('DELETE /financial/expenses/:id', () => {
		describe('happy path (204)', () => {
			it('should delete a variable expense owned by the user', async () => {
				mockVariableExpenseModel.findOne.mockResolvedValueOnce(
					mockVariableExpenseDoc,
				);
				mockVariableExpenseModel.deleteOne.mockResolvedValueOnce({
					deletedCount: 1,
				});

				await request(app.getHttpServer())
					.delete('/financial/expenses/variable-id-123')
					.expect(204);
			});
		});

		describe('not found (404)', () => {
			it('should return 404 when variable expense does not exist', async () => {
				mockVariableExpenseModel.findOne.mockResolvedValueOnce(null);

				await request(app.getHttpServer())
					.delete('/financial/expenses/nonexistent-id')
					.expect(404);
			});
		});

		describe('permissions (403)', () => {
			it('should reject when variable expense belongs to a different user', async () => {
				const guardSpy = jest
					.spyOn(mockGuard, 'canActivate')
					.mockImplementation((ctx: ExecutionContext) => {
						ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
							{ ...mockUser, id: 'other-user-id' };
						return true;
					});

				mockVariableExpenseModel.findOne.mockResolvedValueOnce(
					mockVariableExpenseDoc,
				);

				await request(app.getHttpServer())
					.delete('/financial/expenses/variable-id-123')
					.expect(403);

				guardSpy.mockRestore();
			});
		});
	});
});
