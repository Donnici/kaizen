import {
	AppFeature,
	AppModule,
	type AnonymousUser,
	type AuthenticatedUser,
} from '@kaizen/utils';
import { type ExecutionContext, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { getBotToken } from 'nestjs-telegraf';
import request from 'supertest';
import { AuthCodeRecord } from '../../src/auth/infrastructure/schemas/auth-code.schema';
import { UserRecord } from '../../src/auth/infrastructure/schemas/user.schema';
import { TelegramLinkCodeRecord } from '../../src/telegram/infrastructure/schemas/telegram-link-code.schema';
import { TelegramModule } from '../../src/telegram/telegram.module';

const mockBot = { stop: jest.fn(), use: jest.fn(), command: jest.fn(), hears: jest.fn(), on: jest.fn(), launch: jest.fn() };

const mockUser: AuthenticatedUser = {
	anonymous: false,
	id: 'user-id-123',
	name: 'John Doe',
	email: 'john@example.com',
	phone: '+5511999999999',
	modules: [AppModule.FINANCIAL],
	features: [AppFeature.TELEGRAM_LINK],
};

const mockGuard = {
	canActivate: (ctx: ExecutionContext) => {
		ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user =
			mockUser;
		return true;
	},
};

describe('POST /telegram/link-code', () => {
	let app: INestApplication;

	const mockUserModel = {
		findOne: jest.fn(),
		create: jest.fn(),
		updateOne: jest.fn(),
	};

	const mockAuthCodeModel = {
		findOne: jest.fn(),
		create: jest.fn(),
		updateOne: jest.fn(),
	};

	const mockLinkCodeModel = {
		findOne: jest.fn(),
		create: jest.fn(),
		updateOne: jest.fn(),
	};

	const mockLinkCodeDoc = {
		_id: { toString: () => 'code-id-123' },
		userId: 'user-id-123',
		code: 'ABC123',
		expiresAt: new Date(Date.now() + 10 * 60 * 1000),
		usedAt: null,
	};

	beforeAll(async () => {
		process.env.JWT_SECRET = 'test-secret';
		process.env.TELEGRAM_BOT_TOKEN = 'fake:token';

		const module: TestingModule = await Test.createTestingModule({
			imports: [TelegramModule],
			providers: [{ provide: APP_GUARD, useValue: mockGuard }],
		})
			.overrideProvider(getModelToken(UserRecord.name))
			.useValue(mockUserModel)
			.overrideProvider(getModelToken(AuthCodeRecord.name))
			.useValue(mockAuthCodeModel)
			.overrideProvider(getModelToken(TelegramLinkCodeRecord.name))
			.useValue(mockLinkCodeModel)
			.overrideProvider(getBotToken())
			.useValue(mockBot)
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

	describe('happy path (201)', () => {
		it('should return a 6-character alphanumeric code', async () => {
			mockLinkCodeModel.create.mockResolvedValueOnce(mockLinkCodeDoc);

			const response = await request(app.getHttpServer())
				.post('/telegram/link-code')
				.expect(201);

			expect(response.body.code).toMatch(/^[A-Z0-9]{6}$/);
		});

		it('should persist the code associated with the authenticated user', async () => {
			mockLinkCodeModel.create.mockResolvedValueOnce(mockLinkCodeDoc);

			await request(app.getHttpServer())
				.post('/telegram/link-code')
				.expect(201);

			expect(mockLinkCodeModel.create).toHaveBeenCalledWith(
				expect.objectContaining({ userId: 'user-id-123' }),
			);
		});
	});

	describe('permissions (403)', () => {
		it('should reject anonymous user', async () => {
			const guardSpy = jest
				.spyOn(mockGuard, 'canActivate')
				.mockImplementationOnce((ctx: ExecutionContext) => {
					ctx.switchToHttp().getRequest<{ user: AnonymousUser }>().user = {
						anonymous: true,
						features: [],
					};
					return true;
				});

			const response = await request(app.getHttpServer())
				.post('/telegram/link-code')
				.expect(403);

			expect(response.body.statusCode).toBe(403);
			guardSpy.mockRestore();
		});

		it('should reject authenticated user without TELEGRAM_LINK feature', async () => {
			const guardSpy = jest
				.spyOn(mockGuard, 'canActivate')
				.mockImplementationOnce((ctx: ExecutionContext) => {
					ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user = {
						...mockUser,
						features: [],
					};
					return true;
				});

			const response = await request(app.getHttpServer())
				.post('/telegram/link-code')
				.expect(403);

			expect(response.body.statusCode).toBe(403);
			guardSpy.mockRestore();
		});
	});
});
