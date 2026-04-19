import { z } from 'zod';

export const SignUpSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Invalid email format'),
	phone: z
		.string()
		.regex(
			/^\+[1-9]\d{1,14}$/,
			'Phone must be in E.164 format (e.g. +5511999999999)',
		),
});

export type SignUpDto = z.infer<typeof SignUpSchema>;
