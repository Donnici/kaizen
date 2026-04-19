import { z } from 'zod';

const isEmailOrPhone = (val: string) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || /^\+[1-9]\d{1,14}$/.test(val);

export const VerifyCodeSchema = z.object({
	identifier: z
		.string()
		.min(1, 'Identifier is required')
		.refine(isEmailOrPhone, 'Must be a valid email or E.164 phone number'),
	code: z.string().length(6, 'Code must be 6 digits'),
});

export type VerifyCodeDto = z.infer<typeof VerifyCodeSchema>;
