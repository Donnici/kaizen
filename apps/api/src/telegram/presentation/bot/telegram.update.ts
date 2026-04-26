import { Inject, Injectable } from '@nestjs/common';
import type { Context } from 'telegraf';
import {
    GET_TELEGRAM_EXPENSES_USE_CASE,
    type IGetTelegramExpensesUseCase,
} from '../../application/use-cases/get-telegram-expenses/get-telegram-expenses.use-case';
import {
    GET_TELEGRAM_INCOMES_USE_CASE,
    type IGetTelegramIncomesUseCase,
} from '../../application/use-cases/get-telegram-incomes/get-telegram-incomes.use-case';
import {
    GET_TELEGRAM_SUMMARY_USE_CASE,
    type IGetTelegramSummaryUseCase,
} from '../../application/use-cases/get-telegram-summary/get-telegram-summary.use-case';
import {
    type ILinkTelegramAccountUseCase,
    LINK_TELEGRAM_ACCOUNT_USE_CASE,
} from '../../application/use-cases/link-telegram-account/link-telegram-account.use-case';
import { LinkCodeExpiredError } from '../../domain/errors/link-code-expired.error';
import { LinkCodeNotFoundError } from '../../domain/errors/link-code-not-found.error';
import { TelegramAlreadyLinkedError } from '../../domain/errors/telegram-already-linked.error';
import { TelegramNotLinkedError } from '../../domain/errors/telegram-not-linked.error';

@Injectable()
export class TelegramUpdate {
    constructor(
        @Inject(LINK_TELEGRAM_ACCOUNT_USE_CASE)
        private readonly linkUseCase: ILinkTelegramAccountUseCase,
        @Inject(GET_TELEGRAM_SUMMARY_USE_CASE)
        private readonly summaryUseCase: IGetTelegramSummaryUseCase,
        @Inject(GET_TELEGRAM_EXPENSES_USE_CASE)
        private readonly expensesUseCase: IGetTelegramExpensesUseCase,
        @Inject(GET_TELEGRAM_INCOMES_USE_CASE)
        private readonly incomesUseCase: IGetTelegramIncomesUseCase,
    ) { }

    async onLink(ctx: Context, code: string): Promise<void> {
        const telegramId = String(ctx.from?.id);
        try {
            await this.linkUseCase.execute({ telegramId, code });
            await ctx.reply('✅ Conta vinculada com sucesso!');
        } catch (error) {
            if (error instanceof TelegramAlreadyLinkedError) {
                await ctx.reply('⚠️ Esta conta do Telegram já vinculada a outro usuário.');
                return;
            }
            if (error instanceof LinkCodeExpiredError) {
                await ctx.reply('⏰ Código expirado. Gere um novo código na aplicação.');
                return;
            }
            if (error instanceof LinkCodeNotFoundError) {
                await ctx.reply('❌ Código inválido. Verifique e tente novamente.');
                return;
            }
            throw error;
        }
    }

    async onResumo(ctx: Context, month?: string): Promise<void> {
        const telegramId = String(ctx.from?.id);
        try {
            const result = await this.summaryUseCase.execute({ telegramId, month });
            await ctx.reply(this.formatSummary(result));
        } catch (error) {
            if (error instanceof TelegramNotLinkedError) {
                await ctx.reply('🔗 Vincule sua conta primeiro usando /link <código>.');
                return;
            }
            throw error;
        }
    }

    async onDespesas(ctx: Context, month?: string): Promise<void> {
        const telegramId = String(ctx.from?.id);
        try {
            const result = await this.expensesUseCase.execute({ telegramId, month });
            await ctx.reply(this.formatExpenses(result));
        } catch (error) {
            if (error instanceof TelegramNotLinkedError) {
                await ctx.reply('🔗 Vincule sua conta primeiro usando /link <código>.');
                return;
            }
            throw error;
        }
    }

    async onReceitas(ctx: Context, month?: string): Promise<void> {
        const telegramId = String(ctx.from?.id);
        try {
            const result = await this.incomesUseCase.execute({ telegramId, month });
            await ctx.reply(this.formatIncomes(result));
        } catch (error) {
            if (error instanceof TelegramNotLinkedError) {
                await ctx.reply('🔗 Vincule sua conta primeiro usando /link <código>.');
                return;
            }
            throw error;
        }
    }

    private formatSummary(result: Awaited<ReturnType<IGetTelegramSummaryUseCase['execute']>>): string {
        return [
            `📊 Resumo — ${result.month}`,
            `Receitas:  R$ ${result.totalIncomes.toFixed(2)}`,
            `Despesas:  R$ ${result.totalExpenses.toFixed(2)}`,
            `Saldo:     R$ ${result.finalBalance.toFixed(2)}`,
        ].join('\n');
    }

    private formatExpenses(result: Awaited<ReturnType<IGetTelegramExpensesUseCase['execute']>>): string {
        const lines: string[] = [`💸 Despesas — ${result.month}`];
        if (result.fixed.length > 0) {
            lines.push('\nFixas:');
            for (const e of result.fixed) lines.push(`  • ${e.name}: R$ ${e.amount.toFixed(2)}`);
        }
        if (result.variable.length > 0) {
            lines.push('\nVariáveis:');
            for (const e of result.variable) lines.push(`  • ${e.name}: R$ ${e.amount.toFixed(2)}`);
        }
        if (result.fixed.length === 0 && result.variable.length === 0) {
            lines.push('Nenhuma despesa neste mês.');
        }
        return lines.join('\n');
    }

    private formatIncomes(result: Awaited<ReturnType<IGetTelegramIncomesUseCase['execute']>>): string {
        const lines: string[] = [`💰 Receitas — ${result.month}`];
        if (result.fixed.length > 0) {
            lines.push('\nFixas:');
            for (const e of result.fixed) lines.push(`  • ${e.name}: R$ ${e.amount.toFixed(2)}`);
        }
        if (result.variable.length > 0) {
            lines.push('\nVariáveis:');
            for (const e of result.variable) lines.push(`  • ${e.name}: R$ ${e.amount.toFixed(2)}`);
        }
        if (result.fixed.length === 0 && result.variable.length === 0) {
            lines.push('Nenhuma receita neste mês.');
        }
        return lines.join('\n');
    }
}
