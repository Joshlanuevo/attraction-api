import { AccessControl } from '../models/AccessControl';
import { FirebaseLib } from '../lib/FirebaseLib';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { TransactionTypes } from '../enums/TransactionTypes';
import { isFullArray } from '../utils/helpers';
import admin from '../utils/firebase';

const db = admin.firestore();

export class AccessControlService {
    private firebase: FirebaseLib;
  
    constructor() {
      this.firebase = new FirebaseLib();
    }
  
    /**
     * Get access control by ID
     * @param id The ID of the access control to retrieve
     * @returns AccessControl object or null if not found
     */
    async getAccessControl(id?: string): Promise<AccessControl | null> {
      if (!id) {
        return null;
      }
      
      try {
        // Fetch the data directly from Firestore
        const accessData = await this.getAccessControlData(id);
        
        if (!isFullArray(accessData)) {
          return null;
        }
        
        return new AccessControl(accessData);
      } catch (error) {
        console.error('Error getting access control:', error);
        return null;
      }
    }
  
    /**
     * Get access control data from Firestore
     * @param docID The document ID to retrieve
     * @returns Access control data or empty object if not found
     */
    private async getAccessControlData(docID: string): Promise<Record<string, any>> {
      try {
        const data = await this.firebase.getData(
          FirebaseCollections.access_levels, 
          docID
        );
        
        return data || {};
      } catch (error) {
        console.error('Error getting access control data:', error);
        return {};
      }
    }

  /**
   * Validates booking approval credentials
   * @param type Transaction type
   * @param approvalId Approval ID
   * @param userData User data
   */
  static async validateBookingApprovalCredentials(
    type: TransactionTypes,
    approvalId: string | undefined,
    userData: any,
  ): Promise<void> {
    console.log("Approval ID:", approvalId);
    console.log("Transaction Type:", type);
    console.log("User Access Control Info:", userData);
    if (!approvalId) {
      // If no approval ID provided, check if it's required
      const isRequired = await AccessControlService.isTicketApprovalRequired(type, userData);
      console.log("Is approval required?", isRequired);
      if (isRequired) {
        throw new Error("Approval ID is required for users with access control where ticket approval is required");
      }
      return; // No approval needed
    }
    
    // Verify approval ID is valid
    const approvalRef = db.collection(FirebaseCollections.booking_approvals).doc(approvalId);
    const approvalDoc = await approvalRef.get();
    
    if (!approvalDoc.exists) {
      throw new Error("Approval ID is not valid");
    }
    
    const approvalData = approvalDoc.data();
    
    if (approvalData?.status !== 1) {
      throw new Error("Approval ID is not approved yet");
    }
  }

  /**
   * Check if ticket approval is required for this transaction type and user
   * @param type Transaction type
   * @param user User data
   * @returns Whether approval is required
   */
  static async isTicketApprovalRequired(
    type: TransactionTypes,
    user: any
  ): Promise<boolean> {
    if (user.type === 'AGENT' || user.type === 'MASTERAGENT') {
      return false;
    }
    
    const accessControlService = new AccessControlService();
    const accessLevel = await accessControlService.getAccessControl(user.access_level);
    
    if (!accessLevel) {
      return false;
    }
    
    let isRequired = false;
    
    switch (type) {
      case TransactionTypes.flight:
      case TransactionTypes.flightnonlcc:
        isRequired = accessLevel.airline <= 2;
        break;
      case TransactionTypes.hotel:
        isRequired = accessLevel.hotel <= 2;
        break;
      case TransactionTypes.bus:
        isRequired = accessLevel.bus <= 2;
        break;
      case TransactionTypes.ferry:
        isRequired = accessLevel.ferry <= 2;
        break;
      case TransactionTypes.attractions:
        isRequired = accessLevel.attractions <= 2;
        break;
      case TransactionTypes.visa:
        isRequired = accessLevel.visa <= 2;
        break;
      case TransactionTypes.package:
        isRequired = accessLevel.holiday <= 2;
        break;
      case TransactionTypes.insurance:
        isRequired = accessLevel.insurance <= 2;
        break;
    }
    
    return isRequired;
  }
}