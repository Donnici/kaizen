import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegrafModule } from 'nestjs-telegraf';
import { USER_REPOSITORY } from '../auth/domain/repositories/user.repository.interface';
import { MongooseUserRepository } from '../auth/infrastructure/repositories/mongoose-user.repository';
import { UserRecord, UserSchema } from '../auth/infrastructure/schemas/user.schema';
import { GENERATE_LINK_CODE_USE_CASE } from './application/use-cases/generate-link-code/generate-link-code.use-case';
import { GenerateLinkCodeUseCaseImpl } from './application/use-cases/generate-link-code/generate-link-code.use-case.impl';
import { GET_TELEGRAM_EXPENSES_USE_CASE } from './application/use-cases/get-telegram-expenses/get-telegram-expenses.use-case';
import { GetTelegramExpensesUseCaseImpl } from './application/use-cases/get-telegram-expenses/get-telegram-expenses.use-case.impl';
import { GET_TELEGRAM_INCOMES_USE_CASE } from './application/use-cases/get-telegram-incomes/get-telegram-incomes.use-case';
import { GetTelegramIncomesUseCaseImpl } from './application/use-cases/get-telegram-incomes/get-telegram-incomes.use-case.impl';
import { GET_TELEGRAM_SUMMARY_USE_CASE } from './application/use-cases/get-telegram-summary/get-telegram-summary.use-case';
import { GetTelegramSummaryUseCaseImpl } from './application/use-cases/get-telegram-summary/get-telegram-summary.use-case.impl';
import { LINK_TELEGRAM_ACCOUNT_USE_CASE } from './application/use-cases/link-telegram-account/link-telegram-account.use-case';
import { LinkTelegramAccountUseCaseImpl } from './application/use-cases/link-telegram-account/link-telegram-account.use-case.impl';
import { TELEGRAM_LINK_CODE_REPOSITORY } from './domain/repositories/telegram-link-code.repository.interface';
import { MongooseTelegramLinkCodeRepository } from './infrastructure/repositories/mongoose-telegram-link-code.repository';
import {
    TelegramLinkCodeRecord,
    TelegramLinkCodeSchema,
} from './infrastructure/schemas/telegram-link-code.schema';
import { TelegramUpdate } from './presentation/bot/telegram.update';
import { TelegramController } from './presentation/controllers/telegram.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TelegramLinkCodeRecord.name, schema: TelegramLinkCodeSchema },
            { name: UserRecord.name, schema: UserSchema },
        ]),
        TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                token: config.get<string>('TELEGRAM_BOT_TOKEN', ''),
                launchMethod: 'hook' as const,
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [TelegramController],
    providers: [
        TelegramUpdate,
        {
            provide: USER_REPOSITORY,
            useClass: MongooseUserRepository,
        },
        {
            provide: TELEGRAM_LINK_CODE_REPOSITORY,
            useClass: MongooseTelegramLinkCodeRepository,
        },
        {
            provide: GENERATE_LINK_CODE_USE_CASE,
            useClass: GenerateLinkCodeUseCaseImpl,
        },
        {
            provide: LINK_TELEGRAM_ACCOUNT_USE_CASE,
            useClass: LinkTelegramAccountUseCaseImpl,
        },
        {
            provide: GET_TELEGRAM_SUMMARY_USE_CASE,
            useClass: GetTelegramSummaryUseCaseImpl,
        },
        {
            provide: GET_TELEGRAM_EXPENSES_USE_CASE,
            useClass: GetTelegramExpensesUseCaseImpl,
        },
        {
            provide: GET_TELEGRAM_INCOMES_USE_CASE,
            useClass: GetTelegramIncomesUseCaseImpl,
        },
    ],
})
export class TelegramModule { }
