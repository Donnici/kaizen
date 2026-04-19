import { AppFeature, AppModule, type AuthenticatedUser } from '@kaizen/utils';
import { type ExecutionContext, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { FinancialModule } from '../../src/financial/financial.module';
import { FixedExpenseRecord } from '../../src/financial/infrastructure/schemas/fixed-expense.schema';
import { FixedExpenseRevisionRecord } from '../../src/financial/infrastructure/schemas/fixed-expense-revision.schema';
import { VariableExpenseRecord } from '../../src/financial/infrastructure/schemas/variable-expense.schema';

const mockUser: AuthenticatedUser = {
	anonymous: false,
	id: 'user-id-123',
	name: 'John Doe',
	email: 'john@example.com',
	phone: '+5511999999999',
	modules: [AppModule.FINANCIAL],
	features: [
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

describe('Financial - Variable Expenses', () => {
	let app: INestApplication;

	const mockVariableExpenseModel = {
		create: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		deleteOne: jest.fn(),
	};

	const mockFixedExpenseModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
	};

	const mockFixedExpenseRevisionModel = {
		findOne: jest.fn(),
		create: jest.fn(),
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
			.overrideProvider(getModelToken(VariableExpenseRecord.name))
			.useValue(mockVariableExpenseModel)
			.overrideProvider(getModelToken(FixedExpenseRecord.name))
			.useValue(mockFixedExpenseModel)
			.overrideProvider(getModelToken(FixedExpenseRevisionRecord.name))
			.useValue(mockFixedExpenseRevisionModel)
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

	describe('POST /financial/variable-expenses', () => {
		describe('happy path (201)', () => {
			it('should create a variable expense returning id, name, amount in cents, category, and date', async () => {
				mockVariableExpenseModel.create.mockResolvedValueOnce(
					mockVariableExpenseDoc,
				);

				const response = await request(app.getHttpServer())
					.post('/financial/variable-expenses')
					.send({
						name: 'Jantar fora',
						amount: 8500,
						category: 'Alimentação',
						date: '2026-04-15',
					})
					.expect(201);

				expect(response.body).toEqual({
					id: 'variable-expense-id-123',
					name: 'Jantar fora',
					amount: 8500,
					category: 'Alimentação',
					date: '2026-04-15',
				});
			});

			it('should save amount in cents', async () => {
				mockVariableExpenseModel.create.mockResolvedValueOnce(
					mockVariableExpenseDoc,
				);

				await request(app.getHttpServer())
					.post('/financial/variable-expenses')
					.send({
						name: 'Jantar fora',
						amount: 8500,
						category: 'Alimentação',
						date: '2026-04-15',
					})
					.expect(201);

				expect(mockVariableExpenseModel.create).toHaveBeenCalledWith(
					expect.objectContaining({ amount: 8500 }),
				);
			});

			it('should create a variable expense without a category', async () => {
				const docWithoutCategory = {
					...mockVariableExpenseDoc,
					category: undefined,
				};
				mockVariableExpenseModel.create.mockResolvedValueOnce(
					docWithoutCategory,
				);

				const response = await request(app.getHttpServer())
					.post('/financial/variable-expenses')
					.send({ name: 'Jantar fora', amount: 8500, date: '2026-04-15' })
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
							{ ...mockUser, features: [] };
						return true;
					});
			});

			afterEach(() => {
				guardSpy.mockRestore();
			});

			it('should reject when user does not have FINANCIAL_VARIABLE_EXPENSE_WRITE', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/variable-expenses')
					.send({
						name: 'Jantar fora',
						amount: 8500,
						date: '2026-04-15',
					})
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('body validation (422)', () => {
			it('should reject when name is not provided', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/variable-expenses')
					.send({ amount: 8500, date: '2026-04-15' })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
				);
			});

			it('should reject when amount is not provided', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/variable-expenses')
					.send({ name: 'Jantar fora', date: '2026-04-15' })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ field: 'amount' }),
					]),
				);
			});

			it('should reject when amount is not a positive integer', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/variable-expenses')
					.send({ name: 'Jantar fora', amount: -500, date: '2026-04-15' })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ field: 'amount' }),
					]),
				);
			});

			it('should reject when date is not provided', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/variable-expenses')
					.send({ name: 'Jantar fora', amount: 8500 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'date' })]),
				);
			});

			it('should reject when date has an invalid format', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/variable-expenses')
					.send({ name: 'Jantar fora', amount: 8500, date: '15/04/2026' })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'date' })]),
				);
			});
		});
	});

	describe('GET /financial/variable-expenses', () => {
		describe('happy path (200)', () => {
			it('should return variable expenses for the current month by default', async () => {
				mockVariableExpenseModel.find.mockResolvedValueOnce([
					mockVariableExpenseDoc,
				]);

				const response = await request(app.getHttpServer())
					.get('/financial/variable-expenses')
					.expect(200);

				expect(response.body).toEqual([
					{
						id: 'variable-expense-id-123',
						name: 'Jantar fora',
						amount: 8500,
						category: 'Alimentação',
						date: '2026-04-15',
					},
				]);
			});

			it('should return variable expenses for a specified month', async () => {
				const marchDoc = {
					...mockVariableExpenseDoc,
					_id: { toString: () => 'variable-expense-id-456' },
					date: '2026-03-10',
					month: '2026-03',
				};
				mockVariableExpenseModel.find.mockResolvedValueOnce([marchDoc]);

				const response = await request(app.getHttpServer())
					.get('/financial/variable-expenses?month=2026-03')
					.expect(200);

				expect(response.body).toEqual([
					expect.objectContaining({ date: '2026-03-10' }),
				]);
			});

			it('should return empty array when user has no variable expenses', async () => {
				mockVariableExpenseModel.find.mockResolvedValueOnce([]);

				const response = await request(app.getHttpServer())
					.get('/financial/variable-expenses')
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

			it('should reject when user does not have FINANCIAL_VARIABLE_EXPENSE_READ', async () => {
				const response = await request(app.getHttpServer())
					.get('/financial/variable-expenses')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('query validation (422)', () => {
			it('should reject when month query param has invalid format', async () => {
				const response = await request(app.getHttpServer())
					.get('/financial/variable-expenses?month=april-2026')
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'month' })]),
				);
			});
		});
	});

	describe('DELETE /financial/variable-expenses/:id', () => {
		describe('happy path (204)', () => {
			it('should delete a variable expense owned by the user', async () => {
				mockVariableExpenseModel.findOne.mockResolvedValueOnce(
					mockVariableExpenseDoc,
				);
				mockVariableExpenseModel.deleteOne.mockResolvedValueOnce({
					deletedCount: 1,
				});

				await request(app.getHttpServer())
					.delete('/financial/variable-expenses/variable-expense-id-123')
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
					.delete('/financial/variable-expenses/nonexistent-id')
					.expect(404);

				expect(response.body.statusCode).toBe(404);
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

			it('should reject when user does not have FINANCIAL_VARIABLE_EXPENSE_WRITE', async () => {
				const response = await request(app.getHttpServer())
					.delete('/financial/variable-expenses/variable-expense-id-123')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});

			it('should reject when variable expense belongs to a different user', async () => {
				guardSpy.mockRestore();
				guardSpy = jest
					.spyOn(mockGuard, 'canActivate')
					.mockImplementation((ctx: ExecutionContext) => {
						ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
							{ ...mockUser, id: 'other-user-id' };
						return true;
					});

				mockVariableExpenseModel.findOne.mockResolvedValueOnce(
					mockVariableExpenseDoc,
				);

				const response = await request(app.getHttpServer())
					.delete('/financial/variable-expenses/variable-expense-id-123')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});
	});
});
