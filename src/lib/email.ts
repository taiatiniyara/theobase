import type { SendEmail, EmailSendResult } from '../types';

export function buildReminderEmail(churchName: string, month: string): { html: string; text: string; subject: string } {
  const subject = `Monthly Report Reminder - ${churchName} - ${month}`;
  const text = [
    `Dear Treasurer of ${churchName},`,
    '',
    `This is a friendly reminder to submit your monthly financial report for ${month}.`,
    '',
    'Please log in to Theobase and enter your transactions for the month.',
    '',
    'Your prompt submission helps the Mission maintain accurate financial records.',
    '',
    'Thank you for your faithful service.',
    '— Theobase',
  ].join('\n');

  const html = [
    '<!DOCTYPE html>',
    '<html>',
    '<head><meta charset="utf-8"></head>',
    '<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">',
    `<h2 style="color: #2c5282;">Monthly Report Reminder</h2>`,
    `<p>Dear Treasurer of <strong>${churchName}</strong>,</p>`,
    `<p>This is a friendly reminder to submit your monthly financial report for <strong>${month}</strong>.</p>`,
    `<p>Please <a href="https://theobase.org/dashboard" style="color: #2b6cb0;">log in to Theobase</a> and enter your transactions for the month.</p>`,
    `<p>Your prompt submission helps the Mission maintain accurate financial records.</p>`,
    '<p>Thank you for your faithful service.</p>',
    '<p style="color: #718096; font-size: 0.9em;">— Theobase</p>',
    '</body>',
    '</html>',
  ].join('\n');

  return { html, text, subject };
}

export async function sendEmail(
  emailBinding: SendEmail,
  to: string,
  fromName: string,
  fromAddress: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailSendResult> {
  return emailBinding.send({
    to,
    from: { email: fromAddress, name: fromName },
    subject,
    html,
    text,
  });
}
