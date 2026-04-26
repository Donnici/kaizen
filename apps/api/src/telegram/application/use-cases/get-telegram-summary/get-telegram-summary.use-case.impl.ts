import { Injectable } from '@nestjs/common';
import type {
	GetTelegramSummaryInput,
	GetTelegramSummaryOutput,
	IGetTelegramSummaryUseCase,
} from './get-telegram-summary.use-case';

@Injectable()
export class GetTelegramSummaryUseCaseImpl
	implements IGetTelegramSummaryUseCase
{
	async execute(
		_input: GetTelegramSummaryInput,
	): Promise<GetTelegramSummaryOutput> {
		throw new Error('Not implemented');
	}
}
