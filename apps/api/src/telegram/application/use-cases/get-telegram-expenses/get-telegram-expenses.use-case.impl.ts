import { Injectable } from '@nestjs/common';
import type {
	GetTelegramExpensesInput,
	GetTelegramExpensesOutput,
	IGetTelegramExpensesUseCase,
} from './get-telegram-expenses.use-case';

@Injectable()
export class GetTelegramExpensesUseCaseImpl
	implements IGetTelegramExpensesUseCase
{
	async execute(
		_input: GetTelegramExpensesInput,
	): Promise<GetTelegramExpensesOutput> {
		throw new Error('Not implemented');
	}
}
