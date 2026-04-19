import { z } from 'zod';

export const CreateVariableExpenseSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	amount: z
		.number({ error: 'Amount must be a number' })
		.int('Amount must be an integer')
		.positive('Amount must be a positive integer'),
	category: z.string().min(1).optional(),
	date: z
		.string()
		.regex(
			/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
			'Invalid date format. Expected YYYY-MM-DD',
		),
});

export type CreateVariableExpenseDto = z.infer<
	typeof CreateVariableExpenseSchema
>;
