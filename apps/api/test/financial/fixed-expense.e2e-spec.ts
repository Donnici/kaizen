import { type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { type ExecutionContext } from '@nestjs/common';
import { AppFeature, AppModule, type AuthenticatedUser } from '@kaizen/utils';
import { FinancialModule } from '../../src/financial/financial.module';
import { FixedExpenseRevisionRecord } from '../../src/financial/infrastructure/schemas/fixed-expense-revision.schema';
import { FixedExpenseRecord } from '../../src/financial/infrastructure/schemas/fixed-expense.schema';
import { getCurrentMonth } from '../../src/financial/domain/utils/get-current-month.util';

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
	],
};

const mockGuard = {
	canActivate: (ctx: ExecutionContext) => {
		ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
			mockUser;
		return true;
	},
};

describe('Financial - Fixed Expenses', () => {
	let app: INestApplication;

	const mockExpenseModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
	};

	const mockRevisionModel = {
		findOne: jest.fn(),
		create: jest.fn(),
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

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FinancialModule],
			providers: [{ provide: APP_GUARD, useValue: mockGuard }],
		})
			.overrideProvider(getModelToken(FixedExpenseRecord.name))
			.useValue(mockExpenseModel)
			.overrideProvider(getModelToken(FixedExpenseRevisionRecord.name))
			.useValue(mockRevisionModel)
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

	describe('POST /financial/fixed-expenses', () => {
		describe('happy path (201)', () => {
			it('should create fixed expense returning id, name, amount in cents, effectiveFromMonth', async () => {
				mockExpenseModel.create.mockResolvedValueOnce(mockExpenseDoc);
				mockRevisionModel.create.mockResolvedValueOnce(mockRevisionDoc);

				const response = await request(app.getHttpServer())
					.post('/financial/fixed-expenses')
					.send({ name: 'Aluguel', amount: 100000 })
					.expect(201);

				expect(response.body).toEqual({
					id: 'expense-id-123',
					name: 'Aluguel',
					amount: 100000,
					effectiveFromMonth: expect.stringMatching(/^\d{4}-(0[1-9]|1[0-2])$/),
				});
			});

			it('should save amount in cents', async () => {
				mockExpenseModel.create.mockResolvedValueOnce(mockExpenseDoc);
				mockRevisionModel.create.mockResolvedValueOnce(mockRevisionDoc);

				await request(app.getHttpServer())
					.post('/financial/fixed-expenses')
					.send({ name: 'Aluguel', amount: 100000 })
					.expect(201);

				expect(mockRevisionModel.create).toHaveBeenCalledWith(
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

			it('should reject when user does not have FINANCIAL_FIXED_EXPENSE_WRITE', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/fixed-expenses')
					.send({ name: 'Aluguel', amount: 100000 })
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('body validation (422)', () => {
			it('should reject when name is not provided', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/fixed-expenses')
					.send({ amount: 100000 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
				);
			});

			it('should reject when amount is not provided', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/fixed-expenses')
					.send({ name: 'Aluguel' })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ field: 'amount' }),
					]),
				);
			});

			it('should reject when amount is not a positive integer', async () => {
				const response = await request(app.getHttpServer())
					.post('/financial/fixed-expenses')
					.send({ name: 'Aluguel', amount: -500 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ field: 'amount' }),
					]),
				);
			});
		});
	});

	describe('PATCH /financial/fixed-expenses/:id', () => {
		describe('happy path (200)', () => {
			it('should create a new revision effective from current month and return updated expense', async () => {
				const updatedRevisionDoc = {
					...mockRevisionDoc,
					_id: { toString: () => 'revision-id-456' },
					amount: 150000,
					effectiveFromMonth: getCurrentMonth(),
				};
				mockExpenseModel.findOne.mockResolvedValueOnce(mockExpenseDoc);
				mockRevisionModel.create.mockResolvedValueOnce(updatedRevisionDoc);

				const response = await request(app.getHttpServer())
					.patch('/financial/fixed-expenses/expense-id-123')
					.send({ amount: 150000 })
					.expect(200);

				expect(response.body).toEqual({
					id: 'expense-id-123',
					name: 'Aluguel',
					amount: 150000,
					effectiveFromMonth: getCurrentMonth(),
				});
			});

			it('should not change the amount for months before the current month', async () => {
				mockExpenseModel.findOne.mockResolvedValueOnce(mockExpenseDoc);
				mockRevisionModel.create.mockResolvedValueOnce({
					...mockRevisionDoc,
					effectiveFromMonth: getCurrentMonth(),
				});

				await request(app.getHttpServer())
					.patch('/financial/fixed-expenses/expense-id-123')
					.send({ amount: 150000 })
					.expect(200);

				expect(mockRevisionModel.create).toHaveBeenCalledWith(
					expect.objectContaining({ effectiveFromMonth: getCurrentMonth() }),
				);
				expect(mockRevisionModel.create).toHaveBeenCalledTimes(1);
			});
		});

		describe('not found (404)', () => {
			it('should reject when fixed expense does not exist', async () => {
				mockExpenseModel.findOne.mockResolvedValueOnce(null);

				const response = await request(app.getHttpServer())
					.patch('/financial/fixed-expenses/nonexistent-id')
					.send({ amount: 150000 })
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

			it('should reject when user does not have FINANCIAL_FIXED_EXPENSE_WRITE', async () => {
				const response = await request(app.getHttpServer())
					.patch('/financial/fixed-expenses/expense-id-123')
					.send({ amount: 150000 })
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});

			it('should reject when fixed expense belongs to a different user', async () => {
				guardSpy.mockRestore();
				guardSpy = jest
					.spyOn(mockGuard, 'canActivate')
					.mockImplementation((ctx: ExecutionContext) => {
						ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
							{
								...mockUser,
								id: 'other-user-id',
							};
						return true;
					});

				mockExpenseModel.findOne.mockResolvedValueOnce(mockExpenseDoc);

				const response = await request(app.getHttpServer())
					.patch('/financial/fixed-expenses/expense-id-123')
					.send({ amount: 150000 })
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('body validation (422)', () => {
			it('should reject when amount is not provided', async () => {
				const response = await request(app.getHttpServer())
					.patch('/financial/fixed-expenses/expense-id-123')
					.send({})
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ field: 'amount' }),
					]),
				);
			});

			it('should reject when amount is not a positive integer', async () => {
				const response = await request(app.getHttpServer())
					.patch('/financial/fixed-expenses/expense-id-123')
					.send({ amount: 0 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ field: 'amount' }),
					]),
				);
			});
		});
	});

	describe('GET /financial/fixed-expenses', () => {
		describe('happy path (200)', () => {
			it('should return expenses with their effective amount for the current month by default', async () => {
				mockExpenseModel.find.mockResolvedValueOnce([mockExpenseDoc]);
				mockRevisionModel.findOne.mockResolvedValueOnce(mockRevisionDoc);

				const response = await request(app.getHttpServer())
					.get('/financial/fixed-expenses')
					.expect(200);

				expect(response.body).toEqual([
					{
						id: 'expense-id-123',
						name: 'Aluguel',
						amount: 100000,
						effectiveFromMonth: expect.stringMatching(
							/^\d{4}-(0[1-9]|1[0-2])$/,
						),
					},
				]);
			});

			it('should return expenses with their effective amount for a specified month', async () => {
				const revisionForJan = {
					...mockRevisionDoc,
					amount: 90000,
					effectiveFromMonth: '2026-01',
				};
				mockExpenseModel.find.mockResolvedValueOnce([mockExpenseDoc]);
				mockRevisionModel.findOne.mockResolvedValueOnce(revisionForJan);

				const response = await request(app.getHttpServer())
					.get('/financial/fixed-expenses?month=2026-01')
					.expect(200);

				expect(response.body).toEqual([
					{
						id: 'expense-id-123',
						name: 'Aluguel',
						amount: 90000,
						effectiveFromMonth: '2026-01',
					},
				]);
			});

			it('should reflect the correct revision when the amount changed after the queried month', async () => {
				const oldRevision = {
					...mockRevisionDoc,
					amount: 80000,
					effectiveFromMonth: '2026-01',
				};
				mockExpenseModel.find.mockResolvedValueOnce([mockExpenseDoc]);
				mockRevisionModel.findOne.mockResolvedValueOnce(oldRevision);

				const response = await request(app.getHttpServer())
					.get('/financial/fixed-expenses?month=2026-02')
					.expect(200);

				expect(response.body[0].amount).toBe(80000);
				expect(response.body[0].effectiveFromMonth).toBe('2026-01');
			});

			it('should not return expenses whose first revision is after the queried month', async () => {
				mockExpenseModel.find.mockResolvedValueOnce([mockExpenseDoc]);
				mockRevisionModel.findOne.mockResolvedValueOnce(null);

				const response = await request(app.getHttpServer())
					.get('/financial/fixed-expenses?month=2025-12')
					.expect(200);

				expect(response.body).toEqual([]);
			});

			it('should return empty array when user has no fixed expenses', async () => {
				mockExpenseModel.find.mockResolvedValueOnce([]);

				const response = await request(app.getHttpServer())
					.get('/financial/fixed-expenses')
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

			it('should reject when user does not have FINANCIAL_FIXED_EXPENSE_READ', async () => {
				const response = await request(app.getHttpServer())
					.get('/financial/fixed-expenses')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('query validation (422)', () => {
			it('should reject when month query param has invalid format', async () => {
				const response = await request(app.getHttpServer())
					.get('/financial/fixed-expenses?month=april-2026')
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'month' })]),
				);
			});
		});
	});
});
