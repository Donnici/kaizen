export const MAIL_SERVICE = Symbol('MAIL_SERVICE');

export interface IMailService {
	sendAuthCode(to: string, code: string): Promise<void>;
}
