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

describe('Financial - Incomes (unified)', () => {
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
		updateOne: jest.fn(),
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

	const mockIncomeDoc = {
		_id: { toString: () => 'income-id-123' },
		userId: 'user-id-123',
		name: 'Salário',
		isActive: true,
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
	};

	const mockIncomeRevisionDoc = {
		_id: { toString: () => 'income-revision-id-123' },
		fixedIncomeId: 'income-id-123',
		amount: 500000,
		effectiveFromMonth: getCurrentMonth(),
		createdAt: new Date('2026-04-01T00:00:00.000Z'),
	};

	const mockVariableIncomeDoc = {
		_id: { toString: () => 'variable-income-id-123' },
		userId: 'user-id-123',
		name: 'Freelance',
		amount: 30000,
		category: 'Renda extra',
		date: '2026-04-10',
		month: '2026-04',
		createdAt: new Date('2026-04-10T00:00:00.000Z'),
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

	describe('POST /finance/incomes', () => {
		describe('fixed income — happy path (201)', () => {
			it('should create fixed income with type field in response', async () => {
				mockFixedIncomeModel.create.mockResolvedValueOnce(mockIncomeDoc);
				mockIncomeRevisionModel.create.mockResolvedValueOnce(
					mockIncomeRevisionDoc,
				);

				const response = await request(app.getHttpServer())
					.post('/finance/incomes')
					.send({ type: 'fixed', name: 'Salário', amount: 500000 })
					.expect(201);

				expect(response.body).toEqual({
					type: 'fixed',
					id: 'income-id-123',
					name: 'Salário',
					amount: 500000,
					effectiveFromMonth: expect.stringMatching(/^\d{4}-(0[1-9]|1[0-2])$/),
				});
			});

			it('should save fixed income amount in cents', async () => {
				mockFixedIncomeModel.create.mockResolvedValueOnce(mockIncomeDoc);
				mockIncomeRevisionModel.create.mockResolvedValueOnce(
					mockIncomeRevisionDoc,
				);

				await request(app.getHttpServer())
					.post('/finance/incomes')
					.send({ type: 'fixed', name: 'Salário', amount: 500000 })
					.expect(201);

				expect(mockIncomeRevisionModel.create).toHaveBeenCalledWith(
					expect.objectContaining({ amount: 500000 }),
				);
			});
		});

		describe('variable income — happy path (201)', () => {
			it('should create variable income with type field in response', async () => {
				mockVariableIncomeModel.create.mockResolvedValueOnce(
					mockVariableIncomeDoc,
				);

				const response = await request(app.getHttpServer())
					.post('/finance/incomes')
					.send({
						type: 'variable',
						name: 'Freelance',
						amount: 30000,
						category: 'Renda extra',
						date: '2026-04-10',
					})
					.expect(201);

				expect(response.body).toEqual({
					type: 'variable',
					id: 'variable-income-id-123',
					name: 'Freelance',
					amount: 30000,
					category: 'Renda extra',
					date: '2026-04-10',
				});
			});

			it('should create variable income without category', async () => {
				mockVariableIncomeModel.create.mockResolvedValueOnce({
					...mockVariableIncomeDoc,
					category: undefined,
				});

				const response = await request(app.getHttpServer())
					.post('/finance/incomes')
					.send({
						type: 'variable',
						name: 'Freelance',
						amount: 30000,
						date: '2026-04-10',
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

			it('should reject fixed income when user lacks FINANCIAL_FIXED_INCOME_WRITE', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/incomes')
					.send({ type: 'fixed', name: 'Salário', amount: 500000 })
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});

			it('should reject variable income when user lacks FINANCIAL_VARIABLE_INCOME_WRITE', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/incomes')
					.send({
						type: 'variable',
						name: 'Freelance',
						amount: 30000,
						date: '2026-04-10',
					})
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});

		describe('body validation (422)', () => {
			it('should reject when type is missing', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/incomes')
					.send({ name: 'Salário', amount: 500000 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'type' })]),
				);
			});

			it('should reject variable income when date is missing', async () => {
				const response = await request(app.getHttpServer())
					.post('/finance/incomes')
					.send({ type: 'variable', name: 'Freelance', amount: 30000 })
					.expect(422);

				expect(response.body.message).toEqual(
					expect.arrayContaining([expect.objectContaining({ field: 'date' })]),
				);
			});
		});
	});

	describe('GET /finance/incomes', () => {
		describe('happy path (200)', () => {
			it('should return fixed and variable incomes with type field', async () => {
				mockFixedIncomeModel.find.mockResolvedValueOnce([mockIncomeDoc]);
				mockIncomeRevisionModel.findOne.mockResolvedValueOnce(
					mockIncomeRevisionDoc,
				);
				mockVariableIncomeModel.find.mockResolvedValueOnce([
					mockVariableIncomeDoc,
				]);

				const response = await request(app.getHttpServer())
					.get('/finance/incomes')
					.expect(200);

				expect(response.body).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ type: 'fixed', id: 'income-id-123' }),
						expect.objectContaining({
							type: 'variable',
							id: 'variable-income-id-123',
						}),
					]),
				);
			});

			it('should return empty array when user has no incomes', async () => {
				mockFixedIncomeModel.find.mockResolvedValueOnce([]);
				mockVariableIncomeModel.find.mockResolvedValueOnce([]);

				const response = await request(app.getHttpServer())
					.get('/finance/incomes')
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
					.get('/finance/incomes')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
			});
		});
	});

	describe('PATCH /finance/incomes/:id', () => {
		describe('happy path (200)', () => {
			it('should update fixed income amount and return with type field', async () => {
				const updatedRevision = {
					...mockIncomeRevisionDoc,
					amount: 600000,
					effectiveFromMonth: getCurrentMonth(),
				};
				mockFixedIncomeModel.findOne.mockResolvedValueOnce(mockIncomeDoc);
				mockIncomeRevisionModel.create.mockResolvedValueOnce(updatedRevision);

				const response = await request(app.getHttpServer())
					.patch('/finance/incomes/income-id-123')
					.send({ amount: 600000 })
					.expect(200);

				expect(response.body).toEqual({
					type: 'fixed',
					id: 'income-id-123',
					name: 'Salário',
					amount: 600000,
					effectiveFromMonth: getCurrentMonth(),
				});
			});
		});

		describe('not found (404)', () => {
			it('should return 404 when fixed income does not exist', async () => {
				mockFixedIncomeModel.findOne.mockResolvedValueOnce(null);

				const response = await request(app.getHttpServer())
					.patch('/finance/incomes/nonexistent-id')
					.send({ amount: 600000 })
					.expect(404);

				expect(response.body.statusCode).toBe(404);
			});
		});

		describe('permissions (403)', () => {
			it('should reject when income belongs to a different user', async () => {
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

				mockFixedIncomeModel.findOne.mockResolvedValueOnce(mockIncomeDoc);

				const response = await request(app.getHttpServer())
					.patch('/finance/incomes/income-id-123')
					.send({ amount: 600000 })
					.expect(403);

				expect(response.body.statusCode).toBe(403);
				guardSpy.mockRestore();
			});
		});
	});

	describe('DELETE /finance/incomes/:id', () => {
		describe('fixed income — happy path (204)', () => {
			it('should deactivate fixed income owned by the user', async () => {
				mockVariableIncomeModel.findOne.mockResolvedValueOnce(null);
				mockFixedIncomeModel.findOne.mockResolvedValueOnce(mockIncomeDoc);
				mockFixedIncomeModel.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

				await request(app.getHttpServer())
					.delete('/finance/incomes/income-id-123')
					.expect(204);

				expect(mockFixedIncomeModel.updateOne).toHaveBeenCalledWith(
					{ _id: 'income-id-123' },
					{ $set: { deletedAt: expect.any(Date) } },
				);
			});
		});

		describe('fixed income — not found (404)', () => {
			it('should return 404 when fixed income does not exist', async () => {
				mockVariableIncomeModel.findOne.mockResolvedValueOnce(null);
				mockFixedIncomeModel.findOne.mockResolvedValueOnce(null);

				const response = await request(app.getHttpServer())
					.delete('/finance/incomes/nonexistent-id')
					.expect(404);

				expect(response.body.statusCode).toBe(404);
			});
		});

		describe('fixed income — permissions (403)', () => {
			it('should reject when fixed income belongs to a different user', async () => {
				const guardSpy = jest
					.spyOn(mockGuard, 'canActivate')
					.mockImplementationOnce((ctx: ExecutionContext) => {
						ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
							{ ...mockUser, id: 'other-user-id' };
						return true;
					});

				mockVariableIncomeModel.findOne.mockResolvedValueOnce(null);
				mockFixedIncomeModel.findOne.mockResolvedValueOnce(mockIncomeDoc);

				const response = await request(app.getHttpServer())
					.delete('/finance/incomes/income-id-123')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
				guardSpy.mockRestore();
			});
		});

		describe('variable income — happy path (204)', () => {
			it('should delete variable income owned by the user', async () => {
				mockVariableIncomeModel.findOne.mockResolvedValueOnce(
					mockVariableIncomeDoc,
				);
				mockVariableIncomeModel.deleteOne.mockResolvedValueOnce({
					deletedCount: 1,
				});

				await request(app.getHttpServer())
					.delete('/finance/incomes/variable-income-id-123')
					.expect(204);

				expect(mockVariableIncomeModel.deleteOne).toHaveBeenCalledWith({
					_id: 'variable-income-id-123',
				});
			});
		});

		describe('variable income — not found (404)', () => {
			it('should return 404 when variable income does not exist', async () => {
				mockVariableIncomeModel.findOne.mockResolvedValueOnce(null);

				const response = await request(app.getHttpServer())
					.delete('/finance/incomes/nonexistent-id')
					.expect(404);

				expect(response.body.statusCode).toBe(404);
			});
		});

		describe('variable income — permissions (403)', () => {
			it('should reject when variable income belongs to a different user', async () => {
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

				mockVariableIncomeModel.findOne.mockResolvedValueOnce(
					mockVariableIncomeDoc,
				);

				const response = await request(app.getHttpServer())
					.delete('/finance/incomes/variable-income-id-123')
					.expect(403);

				expect(response.body.statusCode).toBe(403);
				guardSpy.mockRestore();
			});
		});
	});
});
