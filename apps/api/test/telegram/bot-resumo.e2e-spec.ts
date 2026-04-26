import { APP_GUARD } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { getBotToken } from 'nestjs-telegraf';
import { UserRecord } from '../../src/auth/infrastructure/schemas/user.schema';
import { TelegramLinkCodeRecord } from '../../src/telegram/infrastructure/schemas/telegram-link-code.schema';
import { TelegramModule } from '../../src/telegram/telegram.module';
import { TelegramUpdate } from '../../src/telegram/presentation/bot/telegram.update';

const mockBot = { stop: jest.fn(), use: jest.fn(), command: jest.fn(), hears: jest.fn(), on: jest.fn(), launch: jest.fn() };

describe('Bot command: /resumo [mês]', () => {
	let telegramUpdate: TelegramUpdate;

	const mockUserModel = {
		findOne: jest.fn(),
		create: jest.fn(),
		updateOne: jest.fn(),
	};

	const mockLinkCodeModel = {
		findOne: jest.fn(),
		create: jest.fn(),
		updateOne: jest.fn(),
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
		it('should reply with formatted summary for the current month', () => {});

		it('should reply with formatted summary for the specified month', () => {});
	});

	describe('not linked', () => {
		it('should reply asking to link account when telegram is not linked', () => {});
	});
});
