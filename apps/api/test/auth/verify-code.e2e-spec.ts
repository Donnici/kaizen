import { createHash } from 'crypto';
import { type INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppFeature } from '@kaizen/utils';
import { AuthModule } from '../../src/auth/auth.module';
import { CodeAlreadyUsedError } from '../../src/auth/domain/errors/code-already-used.error';
import { CodeExpiredError } from '../../src/auth/domain/errors/code-expired.error';
import { InvalidCodeError } from '../../src/auth/domain/errors/invalid-code.error';
import { UnauthorizedError } from '../../src/auth/domain/errors/unauthorized.error';
import { AuthCodeRecord } from '../../src/auth/infrastructure/schemas/auth-code.schema';
import { UserRecord } from '../../src/auth/infrastructure/schemas/user.schema';

const TEST_CODE = '123456';
const TEST_CODE_HASH = createHash('sha256').update(TEST_CODE).digest('hex');

function decodeJwtPayload(token: string): Record<string, unknown> {
	return JSON.parse(
		Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'),
	);
}

describe('POST /auth/verify-code', () => {
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

	const mockValidAuthCodeDoc = {
		_id: { toString: () => 'code-id-123' },
		userId: 'user-id-123',
		codeHash: TEST_CODE_HASH,
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

	describe('happy path (200)', () => {
		it('should return JWT when code is valid and AUTH_VERIFY_CODE is present', async () => {
			mockUserModel.findOne.mockResolvedValueOnce(mockUserDoc);
			mockAuthCodeModel.findOne.mockResolvedValueOnce(mockValidAuthCodeDoc);
			mockAuthCodeModel.updateOne.mockResolvedValueOnce({});

			const response = await request(app.getHttpServer())
				.post('/auth/verify-code')
				.send({ identifier: 'john@example.com', code: TEST_CODE })
				.expect(200);

			expect(response.body.token).toBeDefined();
			expect(typeof response.body.token).toBe('string');
		});

		it('JWT should contain id, modules and features of the user', async () => {
			mockUserModel.findOne.mockResolvedValueOnce(mockUserDoc);
			mockAuthCodeModel.findOne.mockResolvedValueOnce(mockValidAuthCodeDoc);
			mockAuthCodeModel.updateOne.mockResolvedValueOnce({});

			const response = await request(app.getHttpServer())
				.post('/auth/verify-code')
				.send({ identifier: 'john@example.com', code: TEST_CODE })
				.expect(200);

			const payload = decodeJwtPayload(response.body.token);
			expect(payload).toMatchObject({
				id: 'user-id-123',
				modules: [],
				features: [AppFeature.AUTH_REQUEST_CODE, AppFeature.AUTH_VERIFY_CODE],
			});
		});
	});

	describe('unauthorized (401)', () => {
		it('should reject when identifier is not registered', async () => {
			mockUserModel.findOne.mockResolvedValue(null);

			const response = await request(app.getHttpServer())
				.post('/auth/verify-code')
				.send({ identifier: 'notfound@example.com', code: TEST_CODE })
				.expect(401);

			expect(response.body.message).toBe(new UnauthorizedError().message);
		});

		it('should reject when AUTH_VERIFY_CODE has been removed', async () => {
			const userWithoutPermission = { ...mockUserDoc, features: [] };
			mockUserModel.findOne.mockResolvedValueOnce(userWithoutPermission);

			const response = await request(app.getHttpServer())
				.post('/auth/verify-code')
				.send({ identifier: 'john@example.com', code: TEST_CODE })
				.expect(401);

			expect(response.body.message).toBe(new UnauthorizedError().message);
		});

		it('should reject when code is incorrect', async () => {
			mockUserModel.findOne.mockResolvedValueOnce(mockUserDoc);
			mockAuthCodeModel.findOne.mockResolvedValueOnce(mockValidAuthCodeDoc);

			const response = await request(app.getHttpServer())
				.post('/auth/verify-code')
				.send({ identifier: 'john@example.com', code: '000000' })
				.expect(401);

			expect(response.body.message).toBe(new InvalidCodeError().message);
		});

		it('should reject when code has expired', async () => {
			const expiredAuthCodeDoc = {
				...mockValidAuthCodeDoc,
				expiresAt: new Date(Date.now() - 1),
			};
			mockUserModel.findOne.mockResolvedValueOnce(mockUserDoc);
			mockAuthCodeModel.findOne.mockResolvedValueOnce(expiredAuthCodeDoc);

			const response = await request(app.getHttpServer())
				.post('/auth/verify-code')
				.send({ identifier: 'john@example.com', code: TEST_CODE })
				.expect(401);

			expect(response.body.message).toBe(new CodeExpiredError().message);
		});

		it('should reject when code has already been used', async () => {
			const usedAuthCodeDoc = {
				...mockValidAuthCodeDoc,
				usedAt: new Date('2026-04-19T00:00:00.000Z'),
			};
			mockUserModel.findOne.mockResolvedValueOnce(mockUserDoc);
			mockAuthCodeModel.findOne.mockResolvedValueOnce(usedAuthCodeDoc);

			const response = await request(app.getHttpServer())
				.post('/auth/verify-code')
				.send({ identifier: 'john@example.com', code: TEST_CODE })
				.expect(401);

			expect(response.body.message).toBe(new CodeAlreadyUsedError().message);
		});
	});

	describe('body validation (422)', () => {
		it('should reject when identifier is not provided', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/verify-code')
				.send({ code: TEST_CODE })
				.expect(422);

			expect(response.body.message).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'identifier' }),
				]),
			);
		});

		it('should reject when code is not provided', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/verify-code')
				.send({ identifier: 'john@example.com' })
				.expect(422);

			expect(response.body.message).toEqual(
				expect.arrayContaining([expect.objectContaining({ field: 'code' })]),
			);
		});
	});
});
