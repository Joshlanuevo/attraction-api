import dotenv from 'dotenv';
import { htmlToText } from 'html-to-text';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from "@aws-sdk/client-ses";
import { unhash } from '../utils/cryptoUtil';

dotenv.config();

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
    result: any;
}
  
interface EmailResultError {
    status: 0;
    notice: string;
    data?: any;
    email: string[];
    subject: string;
}
  
type EmailResult = EmailResultSuccess | EmailResultError;

export class EmailService {

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
            // Get AWS credentials using unhash function
            const accessKeyId = await unhash(process.env.AWS_SES_KEY!);
            const secretAccessKey = await unhash(process.env.AWS_SES_SECRET!);
            
            if (!accessKeyId || !secretAccessKey) {
                throw new Error("Missing AWS SES credentials.");
            }
            
            // Create SES client with credentials
            const sesClient = new SESClient({
                region: "ap-southeast-1",
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
            
            // Convert HTML to plain text
            const plaintext_body = htmlToText(html_body, {
                wordwrap: 130,
                preserveNewlines: true
            });
            
            // Prepare email parameters
            const params: SendEmailCommandInput = {
                Destination: {
                    ToAddresses: recipient_emails,
                    CcAddresses: ccAdrs.length > 0 ? ccAdrs : undefined,
                    BccAddresses: bccAdrs.length > 0 ? bccAdrs : undefined,
                },
                ReplyToAddresses: [sender_email],
                Source: `${from_name} <${sender_email}>`,
                Message: {
                    Subject: {
                        Charset: "UTF-8",
                        Data: subject,
                    },
                    Body: {
                        Html: {
                            Charset: "UTF-8",
                            Data: html_body,
                        },
                        Text: {
                            Charset: "UTF-8",
                            Data: plaintext_body,
                        },
                    },
                },
            };
            
            // Send email
            const result = await sesClient.send(new SendEmailCommand(params));
            
            // Return success result
            return {
                status: 1,
                notice: `Email sent! Message ID: ${result.MessageId}`,
                data: result.MessageId || '',
                email: recipient_emails,
                subject: subject,
                result: result,
            };
        } catch (error: any) {
            console.error("Email sending error:", error);
            
            // Return error result
            return {
                status: 0,
                notice: error.message || "Error sending email",
                data: error,
                email: recipient_emails,
                subject: subject,
            };
        }
    }
}