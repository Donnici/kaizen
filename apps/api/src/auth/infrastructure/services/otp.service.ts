import { createHash, randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { IOtpService } from '../../domain/services/otp.service.interface';

@Injectable()
export class OtpService implements IOtpService {
	generate(): string {
		return randomInt(0, 1_000_000).toString().padStart(6, '0');
	}

	hash(code: string): string {
		return createHash('sha256').update(code).digest('hex');
	}

	verify(code: string, hash: string): boolean {
		return this.hash(code) === hash;
	}
}
