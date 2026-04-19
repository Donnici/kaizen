import { z } from 'zod';

export const CreateFixedExpenseSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	amount: z
		.number({ invalid_type_error: 'Amount must be a number' })
		.int('Amount must be an integer')
		.positive('Amount must be a positive integer'),
});

export type CreateFixedExpenseDto = z.infer<typeof CreateFixedExpenseSchema>;
