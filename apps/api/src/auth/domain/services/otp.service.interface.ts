export const OTP_SERVICE = Symbol('OTP_SERVICE');

export interface IOtpService {
	generate(): string;
	hash(code: string): string;
	verify(code: string, hash: string): boolean;
}
