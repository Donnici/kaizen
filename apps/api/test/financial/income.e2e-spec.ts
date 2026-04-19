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
		AppFeature.FINANCIAL_FIXED_INCOME_READ,
		AppFeature.FINANCIAL_FIXED_INCOME_WRITE,
	],
};

const mockGuard = {
	canActivate: (ctx: ExecutionContext) => {
		ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
			mockUser;
		return true;
	},
};

describe('Financial - Incomes', () => {
	let app: INestApplication;

	const mockIncomeModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
	};
	const mockIncomeRevisionModel = {
		findOne: jest.fn(),
		create: jest.fn(),
	};

	const mockIncomeDoc = {
		_id: { toString: () => 'income-id-123' },
		userId: 'user-id-123',
		name: 'Salário',
		isActive: true,
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
	};
	const mockRevisionDoc = {
		_id: { toString: () => 'revision-id-123' },
		fixedIncomeId: 'income-id-123',
		amount: 500000,
		effectiveFromMonth: getCurrentMonth(),
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FinancialModule],
			providers: [{ provide: APP_GUARD, useValue: mockGuard }],
		})
			.overrideProvider(getModelToken(FixedIncomeRecord.name))
			.useValue(mockIncomeModel)
			.overrideProvider(getModelToken(FixedIncomeRevisionRecord.name))
			.useValue(mockIncomeRevisionModel)
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

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /financial/incomes', () => {
		describe('fixed (type=fixed)', () => {
			describe('happy path (201)', () => {
				it('should create fixed income returning id, name, amount, effectiveFromMonth', async () => {
					mockIncomeModel.create.mockResolvedValueOnce(mockIncomeDoc);
					mockIncomeRevisionModel.create.mockResolvedValueOnce(mockRevisionDoc);

					const response = await request(app.getHttpServer())
						.post('/financial/incomes')
						.send({ type: 'fixed', name: 'Salário', amount: 500000 })
						.expect(201);

					expect(response.body).toEqual({
						id: 'income-id-123',
						name: 'Salário',
						amount: 500000,
						effectiveFromMonth: expect.stringMatching(
							/^\d{4}-(0[1-9]|1[0-2])$/,
						),
					});
				});

				it('should save amount in cents', async () => {
					mockIncomeModel.create.mockResolvedValueOnce(mockIncomeDoc);
					mockIncomeRevisionModel.create.mockResolvedValueOnce(mockRevisionDoc);

					await request(app.getHttpServer())
						.post('/financial/incomes')
						.send({ type: 'fixed', name: 'Salário', amount: 500000 })
						.expect(201);

					expect(mockIncomeRevisionModel.create).toHaveBeenCalledWith(
						expect.objectContaining({ amount: 500000 }),
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

				it('should reject when user lacks FINANCIAL_FIXED_INCOME_WRITE', async () => {
					const response = await request(app.getHttpServer())
						.post('/financial/incomes')
						.send({ type: 'fixed', name: 'Salário', amount: 500000 })
						.expect(403);

					expect(response.body.statusCode).toBe(403);
				});
			});

			describe('body validation (422)', () => {
				it('should reject when name is not provided', async () => {
					const response = await request(app.getHttpServer())
						.post('/financial/incomes')
						.send({ type: 'fixed', amount: 500000 })
						.expect(422);

					expect(response.body.message).toEqual(
						expect.arrayContaining([
							expect.objectContaining({ field: 'name' }),
						]),
					);
				});

				it('should reject when amount is not a positive integer', async () => {
					const response = await request(app.getHttpServer())
						.post('/financial/incomes')
						.send({ type: 'fixed', name: 'Salário', amount: 0 })
						.expect(422);

					expect(response.body.message).toEqual(
						expect.arrayContaining([
							expect.objectContaining({ field: 'amount' }),
						]),
					);
				});
			});
		});

		describe('type validation (422)', () => {
			it('should reject when type is not provided', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/incomes')
					.send({ name: 'Salário', amount: 500000 })
					.expect(422);

				expect(response.body.statusCode).toBe(422);
			});
		});
	});

	describe('GET /financial/incomes', () => {
		describe('happy path (200)', () => {
			it('should return incomes with type field for the current month by default', async () => {
				mockIncomeModel.find.mockResolvedValueOnce([mockIncomeDoc]);
				mockIncomeRevisionModel.findOne.mockResolvedValueOnce(mockRevisionDoc);

				const response = await request(app.getHttpServer())
					.get('/financial/incomes')
					.expect(200);

				expect(response.body).toEqual([
					{
						id: 'income-id-123',
						name: 'Salário',
						amount: 500000,
						effectiveFromMonth: expect.stringMatching(
							/^\d{4}-(0[1-9]|1[0-2])$/,
						),
						type: 'fixed',
					},
				]);
			});

			it('should return incomes for a specified month', async () => {
				const revisionForJan = {
					...mockRevisionDoc,
					amount: 450000,
					effectiveFromMonth: '2026-01',
				};
				mockIncomeModel.find.mockResolvedValueOnce([mockIncomeDoc]);
				mockIncomeRevisionModel.findOne.mockResolvedValueOnce(revisionForJan);

				const response = await request(app.getHttpServer())
					.get('/financial/incomes?month=2026-01')
					.expect(200);

				expect(response.body).toEqual([
					expect.objectContaining({
						type: 'fixed',
						amount: 450000,
						effectiveFromMonth: '2026-01',
					}),
				]);
			});

			it('should not return incomes whose first revision is after the queried month', async () => {
				mockIncomeModel.find.mockResolvedValueOnce([mockIncomeDoc]);
				mockIncomeRevisionModel.findOne.mockResolvedValueOnce(null);

				const response = await request(app.getHttpServer())
					.get('/financial/incomes?month=2025-12')
					.expect(200);

				expect(response.body).toEqual([]);
			});

			it('should return empty array when user has no incomes', async () => {
				mockIncomeModel.find.mockResolvedValueOnce([]);

				const response = await request(app.getHttpServer())
					.get('/financial/incomes')
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

			it('should reject when user lacks FINANCIAL_FIXED_INCOME_READ', async () => {
				const response = await request(app.getHttpServer())
					.get('/financial/incomes')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('query validation (422)', () => {
			it('should reject when month has invalid format', async () => {
				const response = await request(app.getHttpServer())
					.get('/financial/incomes?month=april-2026')
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'month' })]),
				);
			});
		});
	});

	describe('PATCH /financial/incomes/:id', () => {
		describe('happy path (200)', () => {
			it('should update fixed income amount creating a new revision', async () => {
				const updatedRevision = {
					...mockRevisionDoc,
					amount: 600000,
					effectiveFromMonth: getCurrentMonth(),
				};
				mockIncomeModel.findOne.mockResolvedValueOnce(mockIncomeDoc);
				mockIncomeRevisionModel.create.mockResolvedValueOnce(updatedRevision);

				const response = await request(app.getHttpServer())
					.patch('/financial/incomes/income-id-123')
					.send({ amount: 600000 })
					.expect(200);

				expect(response.body).toEqual({
					id: 'income-id-123',
					name: 'Salário',
					amount: 600000,
					effectiveFromMonth: getCurrentMonth(),
				});
			});
		});

		describe('not found (404)', () => {
			it('should return 404 when fixed income does not exist', async () => {
				mockIncomeModel.findOne.mockResolvedValueOnce(null);

				await request(app.getHttpServer())
					.patch('/financial/incomes/nonexistent-id')
					.send({ amount: 600000 })
					.expect(404);
			});
		});

		describe('permissions (403)', () => {
			it('should reject when fixed income belongs to a different user', async () => {
				const guardSpy = jest
					.spyOn(mockGuard, 'canActivate')
					.mockImplementation((ctx: ExecutionContext) => {
						ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
							{ ...mockUser, id: 'other-user-id' };
						return true;
					});

				mockIncomeModel.findOne.mockResolvedValueOnce(mockIncomeDoc);

				await request(app.getHttpServer())
					.patch('/financial/incomes/income-id-123')
					.send({ amount: 600000 })
					.expect(403);

				guardSpy.mockRestore();
			});
		});

		describe('body validation (422)', () => {
			it('should reject when amount is not provided', async () => {
				const response = await request(app.getHttpServer())
					.patch('/financial/incomes/income-id-123')
					.send({})
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ field: 'amount' }),
					]),
				);
			});
		});
	});
});
