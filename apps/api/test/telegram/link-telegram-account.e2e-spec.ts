import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { getBotToken } from 'nestjs-telegraf';
import { AuthCodeRecord } from '../../src/auth/infrastructure/schemas/auth-code.schema';
import { UserRecord } from '../../src/auth/infrastructure/schemas/user.schema';
import { TelegramLinkCodeRecord } from '../../src/telegram/infrastructure/schemas/telegram-link-code.schema';
import { TelegramModule } from '../../src/telegram/telegram.module';
import { TelegramUpdate } from '../../src/telegram/presentation/bot/telegram.update';

const mockBot = { stop: jest.fn(), use: jest.fn(), command: jest.fn(), hears: jest.fn(), on: jest.fn(), launch: jest.fn() };

describe('Bot command: /link <code>', () => {
	let telegramUpdate: TelegramUpdate;

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

		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [TelegramModule],
			providers: [{ provide: APP_GUARD, useValue: { canActivate: () => true } }],
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

		telegramUpdate = moduleRef.get(TelegramUpdate);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('happy path', () => {
		it('should link the telegram account and reply with success message', async () => {
			mockUserModel.findOne.mockResolvedValueOnce(null);
			mockLinkCodeModel.findOne.mockResolvedValueOnce(mockLinkCodeDoc);
			mockUserModel.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			mockLinkCodeModel.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

			const ctx = { from: { id: 987654321 }, reply: jest.fn() };
			await telegramUpdate.onLink(ctx as any, 'ABC123');

			expect(mockUserModel.updateOne).toHaveBeenCalledWith(
				{ _id: 'user-id-123' },
				{ $set: { telegramId: '987654321' } },
			);
			expect(ctx.reply).toHaveBeenCalledWith(
				expect.stringContaining('vinculada'),
			);
		});

		it('should mark the link code as used after linking', async () => {
			mockUserModel.findOne.mockResolvedValueOnce(null);
			mockLinkCodeModel.findOne.mockResolvedValueOnce(mockLinkCodeDoc);
			mockUserModel.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
			mockLinkCodeModel.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

			const ctx = { from: { id: 987654321 }, reply: jest.fn() };
			await telegramUpdate.onLink(ctx as any, 'ABC123');

			expect(mockLinkCodeModel.updateOne).toHaveBeenCalledWith(
				{ _id: 'code-id-123' },
				{ $set: { usedAt: expect.any(Date) } },
			);
		});
	});

	describe('code not found', () => {
		it('should reply with invalid code message', async () => {
			mockUserModel.findOne.mockResolvedValueOnce(null);
			mockLinkCodeModel.findOne.mockResolvedValueOnce(null);

			const ctx = { from: { id: 987654321 }, reply: jest.fn() };
			await telegramUpdate.onLink(ctx as any, 'BADCOD');

			expect(ctx.reply).toHaveBeenCalledWith(
				expect.stringContaining('inválido'),
			);
		});
	});

	describe('code expired', () => {
		it('should reply with expired code message', async () => {
			mockUserModel.findOne.mockResolvedValueOnce(null);
			mockLinkCodeModel.findOne.mockResolvedValueOnce({
				...mockLinkCodeDoc,
				expiresAt: new Date(Date.now() - 1000),
			});

			const ctx = { from: { id: 987654321 }, reply: jest.fn() };
			await telegramUpdate.onLink(ctx as any, 'ABC123');

			expect(ctx.reply).toHaveBeenCalledWith(
				expect.stringContaining('expirado'),
			);
		});
	});

	describe('already linked', () => {
		it('should reply with already linked message when this telegram user is already linked to an account', async () => {
			mockUserModel.findOne.mockResolvedValueOnce({
				_id: { toString: () => 'some-user-id' },
				telegramId: '987654321',
			});

			const ctx = { from: { id: 987654321 }, reply: jest.fn() };
			await telegramUpdate.onLink(ctx as any, 'ABC123');

			expect(ctx.reply).toHaveBeenCalledWith(
				expect.stringContaining('já vinculada'),
			);
		});
	});
});
