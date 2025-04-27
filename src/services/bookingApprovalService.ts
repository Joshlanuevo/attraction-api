import { Request } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import sodium from 'libsodium-wrappers';
import { FirebaseLib } from "../lib/FirebaseLib";
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { UserService } from './userService';
import { EmailService } from './emailService';
import { WhitelabelService } from './whitelabelService';

dotenv.config();

interface ApprovalCacheItem {
    details: Record<string, any>;
    expiry: number;
}

export class BookingApprovalService {

    private static approvalCache: Record<string, ApprovalCacheItem> = {};

    // Static method to clean expired cache items
    private static cleanExpiredCache(): void {
      const now = Date.now();
      Object.keys(BookingApprovalService.approvalCache).forEach(key => {
        if (BookingApprovalService.approvalCache[key].expiry < now) {
          delete BookingApprovalService.approvalCache[key];
        }
      });
    }

    // Get an item from the cache
    static getFromCache(requestId: string): Record<string, any> | null {
        const cacheKey = `booking_approval_request_${requestId}`;
        const cached = this.approvalCache[cacheKey];
        
        if (cached && cached.expiry > Date.now()) {
          return cached.details;
        }
        
        // Remove expired item
        if (cached) {
          delete this.approvalCache[cacheKey];
        }
        
        return null;
    }

     // Add an item to the cache
    static addToCache(requestId: string, details: Record<string, any>, expiryMinutes: number = 15): void {
        const cacheKey = `booking_approval_request_${requestId}`;
        this.approvalCache[cacheKey] = {
          details,
          expiry: Date.now() + (expiryMinutes * 60 * 1000),
        };
        
        // Clean expired items whenever we add new items (prevents memory leaks)
        this.cleanExpiredCache();
    }

  
    /**
     * Decrypt a hash to retrieve the original value
     * @param {string} encrypted - The encrypted hash
     * @returns {string|null} - The decrypted value or the original hash if decryption fails
     */
    static async unhash(encrypted: string) {
      if (!encrypted) {
        return null;
      }
      
      try {
        // Ensure sodium is ready to use
        await sodium.ready;
        
        const secret = await this.getSecretKey();
        const key = sodium.from_hex(secret);
        const nonce = sodium.from_hex(encrypted.substring(0, 48));
        const ciphertext = sodium.from_hex(encrypted.substring(48));
        
        const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
        return decrypted ? sodium.to_string(decrypted) : encrypted;
      } catch (error) {
        console.error('Decryption error:', error);
        return encrypted;
      }
    }
    
    /**
     * Create a hash from a value
     * @param {string} value - The value to hash
     * @returns {string} - The encrypted hash
     */
    static async hash(value: string) {
      if (!value) {
        return null;
      }
      
      try {
        // Ensure sodium is ready to use
        await sodium.ready;
        
        const secret = await this.getSecretKey();
        const key = sodium.from_hex(secret);
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
        const message = sodium.from_string(value);
        
        const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);
        const nonceHex = sodium.to_hex(nonce);
        const ciphertextHex = sodium.to_hex(ciphertext);
        
        return nonceHex + ciphertextHex;
      } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Encryption failed');
      }
    }
    
    /**
     * Get the secret key from environment variables
     * @returns {string} - The secret key
     */
    static async getSecretKey() {
      // In Node.js, we can use environment variables instead of parsing an encrypted .env file
      const secretKey = process.env.VITE_APP_SECRET_KEY;
      if (!secretKey) {
        throw new Error('Secret key not found in environment variables');
      }
      return secretKey;
    }
    
    /**
     * Send a booking approval request
     * @param {string} requestId - The request ID
     * @param {string} cost - The cost of the booking
     * @param {Object} requestDetails - The details of the booking request
     * @returns {Object} - The result of the operation
     */
    static async sendBookingApprovalRequest(
      req: Request,
      requestId: string, 
      cost: string, 
      requestDetails: Record<string, any>,
    ) {
      try {
        // Read the email template
        const templatePath = path.join(__dirname, '../utils/templates/CreditTransfers.html');
        
        let htmlTemplate;
        try {
          htmlTemplate = await fs.promises.readFile(templatePath, 'utf8');
        } catch (error) {
          throw new Error(`Failed to read email template: ${(error as any)?.message}`);
        }
        
        // Get user data
        const userId = UserService.getCurrentUserId(req);
        const userData = await UserService.getUser(userId);
        
        if (!userData) {
          throw new Error('User not authenticated');
        }
        
        // Prepare details for the email
        const details: Record<string, any> = {
          applicant_name: `${userData.first_name} ${userData.last_name}`,
          applicant_id: userData.id,
          amount_requested: cost,
          request_id: requestId,
          details_table: this.buildApprovalRequestTable(requestDetails),
        };
        
        // Get parent company details
        const parentCompanyDetails = await UserService.getParentCompanyDetails(userData);
        Object.assign(details, parentCompanyDetails);
        
        // Replace placeholders in the HTML template
        let html = htmlTemplate;
        for (const [key, value] of Object.entries(details)) {
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        
        // Store the approval request in Firebase
        const firebase = new FirebaseLib();
        await firebase.setData(
          FirebaseCollections.booking_approvals,
          requestId,
          {
            id: requestId,
            status: 0,
            timestamp: new Date().toISOString(),
            approved_by: null,
            meta: details,
          }
        );
        
        // Cache the booking request
        this.addToCache(requestId, details);
        
        // Set up email details
        let from = "LakbayHub";
        let supportEmail = "support@lakbayhub.com";
        
        // Check for whitelabel configuration
        const whitelabelConfig = await WhitelabelService.getWhitelabelConfigFromHost(req);
        if (
          whitelabelConfig && 
          whitelabelConfig.support_email_verified && 
          whitelabelConfig.support_email
        ) {
          supportEmail = whitelabelConfig.support_email;
          from = whitelabelConfig.brand;
        }
        
        // Get approvers
        const approvers = await UserService.getApprovers(userData.id, 'attractions');
    
        if (approvers.length === 0) {
          return { 
            status: false, 
            data: [], 
            approvers: [],
            error: 'No approvers found for this user'
          };
        }
    
        const results = [];
        
        // Send emails to all approvers
        for (const approver of approvers) {
          const approverHash = await this.hash(`${approver.id}|${requestId}`);
          
          const approverDetails = { ...details };
          approverDetails.approval_link = `https://api.lakbayhub.com/home/approve_booking_request?hash=${approverHash}`;
          approverDetails.reject_link = `https://api.lakbayhub.com/home/reject_booking_request?hash=${approverHash}`;
          approverDetails.approver_name = approver.name;
          
          // Replace placeholders in the HTML template for this specific approver
          let approverHtmlEmail = html;
          for (const [key, value] of Object.entries(approverDetails)) {
            approverHtmlEmail = approverHtmlEmail.replace(new RegExp(`{{${key}}}`, 'g'), value);
          }
          
          // Send the email
          const emailService = new EmailService();
          try {
            const resultItem = await emailService.sendEmail({
              html_body: approverHtmlEmail,
              recipient_emails: [approver.email],
              subject: "Booking Approval Request",
              sender_email: supportEmail,
              from_name: from,
              bccAdrs: ["tech@lakbayhub.com", "it.support@pinoyonlinebiz.com"]
            });
            
            results.push(resultItem);
          } catch (emailError) {
            results.push({
              status: false,
              error: (emailError as Error)?.message || 'Unknown error',
              recipient: approver.email,
            });
          }
        }
        
        return { 
          status: results.length > 0, 
          data: results, 
          approvers,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return { 
          status: false, 
          error: err.message, 
          trace: err.stack, 
        };
      }
    }
    
    /**
     * Build HTML table for approval request details
     * @param {Object} request - The request details
     * @returns {string} - HTML table rows
     */
    static buildApprovalRequestTable(request: Record<string, any>) {
      let html = '';
      
      for (const [key, value] of Object.entries(request)) {
        html += '<tr>';
        html += '<td style="padding: 5px; color: #333">';
        html += `${key}:`;
        html += '</td>';
        html += '<td style="padding: 5px; color: #333">';
        html += value;
        html += '</td>';
        html += '</tr>';
      }
      
      return html;
    }
    
    /**
     * Validate booking approval credentials
     * @param {string} transactionType - The type of transaction
     * @param {string} approvalId - The approval ID
     * @param {Object} userData - The user data
     * @returns {boolean} - True if validation passes
     */
    static async validateBookingApprovalCredentials(
      transactionType: string,
      approvalId: string,
      userData: { id: string }
    ) {
      if (!approvalId) {
        return true; // No approval required
      }
      
      // Check if the approval exists in Firebase
      const firebase = new FirebaseLib();
      const approvalData = await firebase.getData(FirebaseCollections.booking_approvals, approvalId);
      
      if (!approvalData) {
        throw new Error('Invalid approval ID');
      }
      
      // Check if the approval is for the current user
      if (approvalData.meta.applicant_id !== userData.id) {
        throw new Error('Unauthorized booking approval');
      }
      
      // Check if the approval has been approved
      if (approvalData.status !== 1) {
        throw new Error('Booking has not been approved yet');
      }
      
      return true;
    }
}