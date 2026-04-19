import { type INestApplication, Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../../src/auth/auth.module';
import { EmailAlreadyExistsError } from '../../src/auth/domain/errors/email-already-exists.error';
import { PhoneAlreadyExistsError } from '../../src/auth/domain/errors/phone-already-exists.error';
import { UserRecord } from '../../src/auth/infrastructure/schemas/user.schema';

describe('POST /auth/sign-up', () => {
	let app: INestApplication;

	const mockUserModel = {
		findOne: jest.fn(),
		create: jest.fn(),
	};

	const validPayload = {
		name: 'John Doe',
		email: 'john@example.com',
		phone: '+5511999999999',
	};

	const mockUserDoc = {
		_id: { toString: () => 'user-id-123' },
		name: 'John Doe',
		email: 'john@example.com',
		phone: '+5511999999999',
		modules: [],
		features: [],
		createdAt: new Date('2026-04-19T00:00:00.000Z'),
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AuthModule],
		})
			.overrideProvider(getModelToken(UserRecord.name))
			.useValue(mockUserModel)
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

	describe('happy path', () => {
		it('should register user with valid data returning id, name, email, phone, modules, features, createdAt', async () => {
			mockUserModel.findOne.mockResolvedValue(null);
			mockUserModel.create.mockResolvedValue(mockUserDoc);

			const response = await request(app.getHttpServer())
				.post('/auth/sign-up')
				.send(validPayload)
				.expect(201);

			expect(response.body).toEqual({
				id: 'user-id-123',
				name: 'John Doe',
				email: 'john@example.com',
				phone: '+5511999999999',
				modules: [],
				features: [],
				createdAt: '2026-04-19T00:00:00.000Z',
			});
		});

		it('should save user with empty modules and features', async () => {
			mockUserModel.findOne.mockResolvedValue(null);
			mockUserModel.create.mockResolvedValue(mockUserDoc);

			const response = await request(app.getHttpServer())
				.post('/auth/sign-up')
				.send(validPayload)
				.expect(201);

			expect(response.body.modules).toEqual([]);
			expect(response.body.features).toEqual([]);
			expect(mockUserModel.create).toHaveBeenCalledWith(validPayload);
		});

		it('should accept request without token (anonymous user with AUTH_SIGN_UP)', async () => {
			mockUserModel.findOne.mockResolvedValue(null);
			mockUserModel.create.mockResolvedValue(mockUserDoc);

			await request(app.getHttpServer())
				.post('/auth/sign-up')
				.send(validPayload)
				// No Authorization header — anonymous user has AUTH_SIGN_UP permission
				.expect(201);
		});
	});

	describe('body validation (422)', () => {
		it('should reject when required fields are not provided', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/sign-up')
				.send({})
				.expect(422);

			expect(response.body.statusCode).toBe(422);
			expect(response.body.message).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'name' }),
					expect.objectContaining({ field: 'email' }),
					expect.objectContaining({ field: 'phone' }),
				]),
			);
		});

		it('should reject when email has invalid format', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/sign-up')
				.send({ ...validPayload, email: 'not-a-valid-email' })
				.expect(422);

			expect(response.body.message).toEqual(
				expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
			);
		});

		it('should reject when phone is not in E.164 format', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/sign-up')
				.send({ ...validPayload, phone: '11999999999' })
				.expect(422);

			expect(response.body.message).toEqual(
				expect.arrayContaining([expect.objectContaining({ field: 'phone' })]),
			);
		});

		it('should emit debug log with sent payload and errors when validation fails', async () => {
			const debugSpy = jest.spyOn(Logger.prototype, 'debug');

			await request(app.getHttpServer())
				.post('/auth/sign-up')
				.send({ name: 'J', email: 'bad', phone: '123' })
				.expect(422);

			expect(debugSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.objectContaining({ name: 'J' }),
					errors: expect.any(Array),
				}),
				'Body validation failed',
			);
		});
	});

	describe('permissions (403)', () => {
		it.todo('should reject when authenticated user tries to sign up (AUTH_SIGN_UP not present)');
	});

	describe('business rules (409)', () => {
		it('should reject when email is already registered', async () => {
			mockUserModel.findOne.mockResolvedValueOnce(mockUserDoc);

			const response = await request(app.getHttpServer())
				.post('/auth/sign-up')
				.send(validPayload)
				.expect(409);

			expect(response.body.message).toBe(new EmailAlreadyExistsError().message);
		});

		it('should reject when phone is already registered', async () => {
			mockUserModel.findOne
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(mockUserDoc);

			const response = await request(app.getHttpServer())
				.post('/auth/sign-up')
				.send(validPayload)
				.expect(409);

			expect(response.body.message).toBe(new PhoneAlreadyExistsError().message);
		});
	});
});
