import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendPasswordResetEmail(email: string, token: string, name: string) {
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      text: `Hello ${name}, Please use this link to reset your password: ${resetUrl}`,
      html: `<p>Hello ${name},</p><p>Please click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });
  }
}
