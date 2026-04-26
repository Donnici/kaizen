import { Injectable } from '@nestjs/common';
import type {
	GetTelegramIncomesInput,
	GetTelegramIncomesOutput,
	IGetTelegramIncomesUseCase,
} from './get-telegram-incomes.use-case';

@Injectable()
export class GetTelegramIncomesUseCaseImpl
	implements IGetTelegramIncomesUseCase
{
	async execute(
		_input: GetTelegramIncomesInput,
	): Promise<GetTelegramIncomesOutput> {
		throw new Error('Not implemented');
	}
}
