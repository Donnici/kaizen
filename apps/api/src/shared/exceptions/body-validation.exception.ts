import { Logger, UnprocessableEntityException } from '@nestjs/common';
import type { ZodError } from 'zod';

export class BodyValidationError extends UnprocessableEntityException {
	private static readonly logger = new Logger(BodyValidationError.name);

	constructor(error: ZodError, body: unknown) {
		const issues = error.issues.map((issue) => ({
			field: issue.path.join('.'),
			message: issue.message,
		}));

		super({
			statusCode: 422,
			error: 'Unprocessable Entity',
			message: issues,
		});

		BodyValidationError.logger.debug(
			{ body, errors: error.issues },
			'Body validation failed',
		);
	}
}
