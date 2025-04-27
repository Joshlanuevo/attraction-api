import dotenv from 'dotenv';
import AWS from 'aws-sdk';
import { htmlToText } from 'html-to-text';
import MimeNode from 'nodemailer/lib/mime-node';
import * as nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer';

interface SendEmailOptions {
    html_body: string;
    recipient_emails: string[];
    subject: string;
    sender_email?: string;
    from_name?: string;
    ccAdrs?: string[];
    bccAdrs?: string[];
}
  
interface EmailResultSuccess {
    status: 1;
    notice: string;
    data: string;
    email: string[];
    subject: string;
    result: AWS.SES.SendRawEmailResponse;
}
  
interface EmailResultError {
    status: 0;
    notice: string;
    data?: string;
    email: string[];
    subject: string;
}
  
type EmailResult = EmailResultSuccess | EmailResultError;

export class EmailService {

    private sesClient: AWS.SES;

    constructor() {
      // Initialize AWS SES client
      this.sesClient = new AWS.SES({
        credentials: {
          accessKeyId: process.env.AWS_SES_KEY as string,
          secretAccessKey: process.env.AWS_SES_SECRET as string,
        },
        region: 'ap-southeast-1',
        apiVersion: '2010-12-01',
      });
    }

    /**
     * Send an email using AWS SES with Raw Email to support custom headers
     * @param options - Email options
     * @returns Result of the email sending operation
     */
    async sendEmail({
        html_body,
        recipient_emails,
        subject,
        sender_email = "support@lakbayhub.com",
        from_name = "LakbayHub",
        ccAdrs = [],
        bccAdrs = ["tech@lakbayhub.com", "it.support@pinoyonlinebiz.com"],
    }: SendEmailOptions): Promise<EmailResult> {
        try {
            const plaintextBody = htmlToText(html_body, {
                wordwrap: 130,
                preserveNewlines: true
            });

            // Create a new mail composer using nodemailer
            const message = new MailComposer({
                from: `${from_name} <${sender_email}>`,
                to: recipient_emails.join(', '),
                cc: ccAdrs.length > 0 ? ccAdrs.join(', ') : undefined,
                bcc: bccAdrs.length > 0 ? bccAdrs.join(', ') : undefined,
                replyTo: sender_email,
                subject: subject,
                text: plaintextBody,
                html: html_body,
                headers: {
                    'List-Unsubscribe': `<mailto:${sender_email}?subject=unsubscribe-me>`
                }
            });

            const rawMessage = await new Promise<Buffer>((resolve, reject) => {
                message.compile().build((err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            // Create parameters for sendRawEmail
            const params: AWS.SES.SendRawEmailRequest = {
                RawMessage: {
                    Data: rawMessage
                },
                Destinations: [...recipient_emails, ...ccAdrs, ...bccAdrs],
                Source: `${from_name} <${sender_email}>`
            };

            // Send the raw email
            const result = await this.sesClient.sendRawEmail(params).promise();
            const messageId = result.MessageId || '';

            // Return success result
            return {
                status: 1,
                notice: `Email sent! Message ID: ${messageId}`,
                data: messageId,
                email: recipient_emails,
                subject: subject,
                result: result,
            };
        } catch (error: any) {
            console.error("Email sending error:", error);
            
            // Return error result
            return {
                status: 0,
                notice: error.message,
                data: error.stack,
                email: recipient_emails,
                subject: subject,
            };
        }
    }
}