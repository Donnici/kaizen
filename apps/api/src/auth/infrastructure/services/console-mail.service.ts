import { Injectable, Logger } from '@nestjs/common';
import type { IMailService } from '../../domain/services/mail.service.interface';

@Injectable()
export class ConsoleMailService implements IMailService {
	private readonly logger = new Logger(ConsoleMailService.name);

	async sendAuthCode(to: string, code: string): Promise<void> {
		this.logger.log({ to, code }, 'Auth code sent');
	}
}
