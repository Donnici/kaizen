import { AppFeature } from '@kaizen/utils';
import { type INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../../src/auth/auth.module';
import { AuthCodeRecord } from '../../src/auth/infrastructure/schemas/auth-code.schema';
import { UserRecord } from '../../src/auth/infrastructure/schemas/user.schema';

describe('POST /auth/request-code', () => {
	let app: INestApplication;

	const mockUserModel = {
		findOne: jest.fn(),
		create: jest.fn(),
	};

	const mockAuthCodeModel = {
		findOne: jest.fn(),
		create: jest.fn(),
		updateOne: jest.fn(),
	};

	const mockUserDoc = {
		_id: { toString: () => 'user-id-123' },
		name: 'John Doe',
		email: 'john@example.com',
		phone: '+5511999999999',
		modules: [],
		features: [AppFeature.AUTH_REQUEST_CODE, AppFeature.AUTH_VERIFY_CODE],
		createdAt: new Date('2026-04-19T00:00:00.000Z'),
	};

	const mockAuthCodeDoc = {
		_id: { toString: () => 'code-id-123' },
		userId: 'user-id-123',
		codeHash: 'some-hash',
		expiresAt: new Date(Date.now() + 15 * 60 * 1000),
		usedAt: null,
		createdAt: new Date(),
	};

	beforeAll(async () => {
		process.env.JWT_SECRET = 'test-secret';

		const module: TestingModule = await Test.createTestingModule({
			imports: [AuthModule],
		})
			.overrideProvider(getModelToken(UserRecord.name))
			.useValue(mockUserModel)
			.overrideProvider(getModelToken(AuthCodeRecord.name))
			.useValue(mockAuthCodeModel)
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

	describe('sending code (204)', () => {
		it('should send code when identifier is a registered email with AUTH_REQUEST_CODE', async () => {
			mockUserModel.findOne.mockResolvedValueOnce(mockUserDoc);
			mockAuthCodeModel.create.mockResolvedValueOnce(mockAuthCodeDoc);

			await request(app.getHttpServer())
				.post('/auth/request-code')
				.send({ identifier: 'john@example.com' })
				.expect(204);

			expect(mockAuthCodeModel.create).toHaveBeenCalledWith(
				expect.objectContaining({ userId: 'user-id-123' }),
			);
		});

		it('should send code when identifier is a registered phone with AUTH_REQUEST_CODE', async () => {
			mockUserModel.findOne
				.mockResolvedValueOnce(null) // findByEmail returns null
				.mockResolvedValueOnce(mockUserDoc); // findByPhone returns user
			mockAuthCodeModel.create.mockResolvedValueOnce(mockAuthCodeDoc);

			await request(app.getHttpServer())
				.post('/auth/request-code')
				.send({ identifier: '+5511999999999' })
				.expect(204);

			expect(mockAuthCodeModel.create).toHaveBeenCalledWith(
				expect.objectContaining({ userId: 'user-id-123' }),
			);
		});

		it('should return 204 silently when identifier is not registered', async () => {
			mockUserModel.findOne.mockResolvedValue(null);

			await request(app.getHttpServer())
				.post('/auth/request-code')
				.send({ identifier: 'notfound@example.com' })
				.expect(204);

			expect(mockAuthCodeModel.create).not.toHaveBeenCalled();
		});

		it('should return 204 silently when AUTH_REQUEST_CODE has been removed', async () => {
			const userWithoutPermission = { ...mockUserDoc, features: [] };
			mockUserModel.findOne.mockResolvedValueOnce(userWithoutPermission);

			await request(app.getHttpServer())
				.post('/auth/request-code')
				.send({ identifier: 'john@example.com' })
				.expect(204);

			expect(mockAuthCodeModel.create).not.toHaveBeenCalled();
		});
	});

	describe('body validation (422)', () => {
		it('should reject when identifier is not provided', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/request-code')
				.send({})
				.expect(422);

			expect(response.body.message).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'identifier' }),
				]),
			);
		});

		it('should reject when identifier is not a valid email or E.164 phone', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/request-code')
				.send({ identifier: 'not-valid' })
				.expect(422);

			expect(response.body.message).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'identifier' }),
				]),
			);
		});
	});
});
