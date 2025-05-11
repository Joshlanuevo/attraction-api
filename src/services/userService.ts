import { Request } from 'express';
import { UserModel } from '../models/User/UserModel';
import { UserBalance } from '../models/User/UserBalance';
import { Approver } from '../models/Approver';
import { FirebaseLib } from '../lib/FirebaseLib';
import { UserTypes } from '../enums/UserTypes';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { AccessControlService } from './accessControlService';
import { AgencyService } from './agencyService';
import { checkSufficientOnHoldBalance } from './userFundsService';
import { isAdmin } from '../utils/user';
import { isFullArray } from '../utils/helpers';
import admin from "../utils/firebase";

const db = admin.firestore();
const accessControlService = new AccessControlService();
const agencyService = new AgencyService();

export class UserService {
    private static async getUserInternal(userId: string): Promise<UserModel | null> {
        const userDoc = await db.collection(FirebaseCollections.users).doc(userId).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data() as UserModel;
        return {
            ...userData,
            userId: userDoc.id, // attach the document ID explicitly
            toJSON: () => ({
                ...userData,
                userId: userDoc.id,
            }),
        };
    }

    static async getUser(userId: string): Promise<UserModel | null> {
        try {
            return await this.getUserInternal(userId);
        } catch (error) {
            console.error('Error getting user data:', error);
            throw new Error('Failed to retrieve user data');
        }
    }

    static getCurrentUserId(req: Request): string {
        if (!req.user?.userId) {
          throw new Error('User session not found or invalid');
        }
        return req.user.userId;
    }

    static async getUserBalanceData(userId: string): Promise<UserBalance | null> {
        try {
            const user = await this.getUserInternal(userId);
            if (!user) return null;

            const walletId = await this.getEffectiveUserWalletId(user);
            const walletUser = await this.getUserInternal(walletId);
            if (!walletUser) return null;

            const balanceDoc = await db
                .collection(FirebaseCollections.user_balance)
                .doc(walletId)
                .get();

            const data = balanceDoc.data() as UserBalance | undefined;
            const currency = walletUser.currency ?? 'PHP';
            const totalAmount = typeof data?.total === 'object' ? data.total.amount : data?.total ?? 0;

            return {
                userId: walletId,
                total: { amount: totalAmount, currency },
                count: data?.count ?? 0,
                last5: data?.last5 ?? [],
                currency,
            };
        } catch (error) {
            throw new Error('Failed to retrieve user balance data');
        }
    }

    private static async getEffectiveUserWalletId(user: UserModel): Promise<string> {
        try {
            const accessLevel = await accessControlService.getAccessControl(user.access_level);
    
            if (
                user.type === UserTypes.SUBAGENT &&
                accessLevel?.isSharedWallet === true
            ) {
                const userIdLower = user.id.toLowerCase();
                const agencyIdLower = user.agency_id?.toLowerCase() || '';
    
                if (userIdLower.includes('admin') || agencyIdLower.includes('admin')) {
                    return user.id;
                }
                if (user.id === user.agency_id) {
                    const parentAgency = await agencyService.getAgency(user.agency_id);
                    if (!parentAgency || !parentAgency.masteragent_id) {
                        throw new Error("Invalid parent partner");
                    }
                    const parentUser = await this.getUserInternal(parentAgency.masteragent_id);
                    if (!parentUser) {
                        throw new Error("Invalid parent company");
                    }
                    return parentUser.id;
                } else {
                    const parentUser = await this.getUserInternal(user.userId);
                    if (!parentUser) {
                        throw new Error("Invalid parent company");
                    }
                    return parentUser.id;
                }
            }
    
            return user.id;
        } catch (error) {
            console.error('Error resolving wallet ID:', error);
            throw new Error('Failed to resolve wallet ID');
        }
    }


    /**
     * Validates if user has sufficient balance for transaction
     * @param userId User ID
     * @param amount Transaction amount
     * @param currency User currency
     */
    static async validateUserBalance(
        userId: string,
        amount: number,
        currency: string,
    ): Promise<void> {
        const user = await UserService.getUser(userId);
        
        // Skip balance validation for admin users
        if (isAdmin(user)) {
            console.log("Admin user - skipping balance validation");
            return;
        }
        
        const userBalance = await UserService.getUserBalanceData(userId);
            
        if (!userBalance) {
            throw new Error("Unable to retrieve balance information");
        }

        const nextBalance = userBalance.total.amount - amount;

        // Log balance information
        console.log({
            message: 'Attraction balance check',
            balance: userBalance.total,
            total: amount,
            outcome: nextBalance
        });

        // Check if user has enough balance
        if (nextBalance < 0) {
            throw new Error("User does not have enough balance");
        }

        // Check if the user has enough balance after deducting funds on hold
        const result = await checkSufficientOnHoldBalance(
            userId,
            { amount: nextBalance, currency },
            true
        );
        
        // This will handle the error state according to checkSufficientOnHoldBalance's result
        if (result !== true) {
            throw new Error("Not enough credits for this transaction due to funds on hold");
        }
    }

    static async getParentCompanyDetails(userId?: string | UserModel | null): Promise<Record<string, string>> {
        const details: Record<string, string> = {
            logo: "https://potb.b-cdn.net/LakbayHub/lakbayhub-logo.png",
            primary_color: "#1b6ec2",
            background_color: "#f5f5f5",
            company_address: "4/F Kassco Building, Rizal Ave. cor. Cavite St., Brgy 209, Santa Cruz, Manila ",
            company_name: "Lakbay Hub",
            company_email: "support@lakbayhub.com",
            company_phone: "+639123456789",
            contact_name: "Glady Anne Bolasa",
            show_logo: "display:block;"
        };
    
        try {
            if (typeof userId === 'string' && userId.includes('admin')) {
                return details;
            }
    
            const userData: UserModel | null = typeof userId === 'object' && userId !== null
                ? userId
                : userId
                    ? await this.getUser(userId)
                    : null;
    
            if (!userData) return details;
    
            if (userData.type === UserTypes.SUBAGENT) {
                if (
                    userData.agency_id?.includes('admin') ||
                    userData.userId?.includes('admin')
                ) {
                    return details;
                }
    
                if (userData.agency_id === userData.userId) {
                    const agencyData = await agencyService.getAgency(userData.agency_id);
                    if (agencyData) {
                        details.logo = agencyData.brand_logo?.replace(/ /g, '%20') || details.logo;
                        details.company_address = [
                            agencyData.address_1,
                            agencyData.address_2,
                            agencyData.city_name,
                            agencyData.region_name,
                            agencyData.country
                        ].filter(Boolean).join(', ');
                        details.company_name = agencyData.company_name || details.company_name;
                        details.company_email = agencyData.email || details.company_email;
                        details.company_phone = agencyData.mobile_no || details.company_phone;
    
                        const masterAgent = await this.getUserInternal(agencyData.masteragent_id);
                        if (masterAgent) {
                            details.contact_name = `${masterAgent.first_name} ${masterAgent.last_name}`;
                        }
                    }
                } else {
                    const companyData = await this.getUserInternal(userData.userId);
                    if (companyData) {
                        details.logo = companyData.profile_pic?.replace(/ /g, '%20') || details.logo;
                        details.company_address = [
                            companyData.address_1,
                            companyData.address_2,
                            companyData.city_name,
                            companyData.region_name,
                            companyData.country_name
                        ].filter(Boolean).join(', ');
                        details.company_name = companyData.company_name || `${companyData.first_name} ${companyData.last_name}`;
                        details.company_email = companyData.email || details.company_email;
                        details.company_phone = companyData.mobile_no || details.company_phone;
                        details.contact_name = `${companyData.first_name} ${companyData.last_name}`;
                    }
                }
            } else if (userData.type === UserTypes.AGENT) {
                details.logo = userData.profile_pic?.replace(/ /g, '%20') || details.logo;
                details.company_address = [
                    userData.address_1,
                    userData.address_2,
                    userData.city_name,
                    userData.region_name,
                    userData.country_name
                ].filter(Boolean).join(', ');
                details.company_name = userData.company_name || `${userData.first_name} ${userData.last_name}`;
                details.company_email = userData.email || details.company_email;
                details.company_phone = userData.mobile_no || details.company_phone;
                details.contact_name = `${userData.first_name} ${userData.last_name}`;
            } else if (
                userData.type === UserTypes.MASTERAGENT ||
                userData.type === UserTypes.WHITELABEL
            ) {
                const agencyData = await agencyService.getAgency(userData.agency_id);
                if (agencyData) {
                    details.logo = agencyData.brand_logo?.replace(/ /g, '%20') || details.logo;
                    details.company_address = [
                        agencyData.address_1,
                        agencyData.address_2,
                        agencyData.city_name,
                        agencyData.region_name,
                        agencyData.country
                    ].filter(Boolean).join(', ');
                    details.company_name = agencyData.company_name || details.company_name;
                    details.company_email = agencyData.email || details.company_email;
                    details.company_phone = agencyData.mobile_no || details.company_phone;
    
                    const masterAgent = await this.getUserInternal(agencyData.masteragent_id);
                    if (masterAgent) {
                        details.contact_name = `${masterAgent.first_name} ${masterAgent.last_name}`;
                    }
                }
            }
    
            details.show_logo = details.logo ? 'display:block;' : 'display:none;';
            return details;
        } catch (error) {
            console.error('Error in getParentCompanyDetails:', error);
            return details;
        }
    }

    static async getApprovers(userId: string, type: string = 'airline'): Promise<Approver[]> {
        const firebase = new FirebaseLib();
        const userData = await this.getUser(userId);
        const approvingUsers: Approver[] = [];
        let query: [string, FirebaseFirestore.WhereFilterOp, any] | null = null;
    
        if (!userData) {
            throw new Error('User not found');
        }
    
        if (userData.type === UserTypes.SUBAGENT) {
            const isAdmin = userData.agency_id.includes('admin') || userData.userId.includes('admin');
    
            if (isAdmin) {
                const superAdmins = await this.getSuperAdminUsers();
                const accountingUsers = await this.getAccountingUsers();
                const allAdmins = [...superAdmins, ...accountingUsers];
    
                for (const user of allAdmins) {
                    approvingUsers.push({
                        id: user.id,
                        name: `${user.first_name} ${user.last_name}`,
                        email: user.email,
                    });
                }
    
                query = ['created_by', '==', 'admin_user'];
            }
    
            // Staff belongs to partner account
            else if (userData.agency_id === userData.userId) {
                const agencyData = await agencyService.getAgency(userData.agency_id);
                if (!agencyData) {
                    throw new Error('Agency data not found');
                }
    
                const masterAgentUser = await this.getUser(agencyData.masteragent_id);
    
                if (!masterAgentUser) {
                    throw new Error('Master agent user not found');
                }
    
                approvingUsers.push({
                    id: masterAgentUser.id,
                    name: `${masterAgentUser.first_name} ${masterAgentUser.last_name}`,
                    email: masterAgentUser.email,
                });
    
                query = ['created_by', '==', agencyData.masteragent_id];
            }
    
            // Staff belongs to company account
            else {
                const companyUser = await this.getUser(userData.userId);
    
                if (!companyUser) {
                    throw new Error('Company user not found');
                }
    
                approvingUsers.push({
                    id: companyUser.id,
                    name: `${companyUser.first_name} ${companyUser.last_name}`,
                    email: companyUser.email,
                });
    
                query = ['created_by', '==', userData.userId];
            }
        }
    
        else if (userData.type === UserTypes.AGENT) {
            query = ['created_by', '==', userData.id];
        }
    
        // Find access levels for those users
        const accessLevels = query
            ? await firebase.getDocumentsFiltered(
                FirebaseCollections.access_levels,
                [query],
              )
            : [];
    
        const accessLevelsWithApproval = accessLevels.filter((level: any) => {
            const access = level[type];
            const hasApprovalAccess = access === 4;
            return hasApprovalAccess;
        });      
    
        if (isFullArray(accessLevelsWithApproval)) {
            const accessLevelIds = accessLevelsWithApproval.map((level: any) => level.id);
      
            const approversRaw = await firebase.getDocumentsFiltered(
              FirebaseCollections.users,
              [['access_level', 'in', accessLevelIds]]
            );
      
            for (const user of approversRaw) {
              approvingUsers.push({
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
              });
            }
        }
        
        return approvingUsers;
    }

    /**
     * Retrieves all users with SUPERADMIN access level
     * @returns Array of UserModel objects for all super admin users
     */
    static async getSuperAdminUsers(): Promise<UserModel[]> {
        try {
            const superAdminsSnapshot = await db
                .collection(FirebaseCollections.users)
                .where("type", "==", UserTypes.SUPERADMIN)
                .get();
            
            if (superAdminsSnapshot.empty) {
                return [];
            }
            
            const superAdmins: UserModel[] = [];
            superAdminsSnapshot.forEach(doc => {
                superAdmins.push(doc.data() as UserModel);
            });
            
            return superAdmins;
        } catch (error) {
            console.error('Error getting super admin users:', error);
            throw new Error('Failed to retrieve super admin users');
        }
    }

    /**
     * Retrieves all users with ACCOUNTING access level
     * @returns Array of UserModel objects for all accounting users
     */
    static async getAccountingUsers(): Promise<UserModel[]> {
        try {
            const accountingUsersSnapshot = await db
                .collection(FirebaseCollections.users)
                .where("type", "==", UserTypes.ACCOUNTING)
                .get();
            
            if (accountingUsersSnapshot.empty) {
                return [];
            }
            
            const accountingUsers: UserModel[] = [];
            accountingUsersSnapshot.forEach(doc => {
                accountingUsers.push(doc.data() as UserModel);
            });
            
            return accountingUsers;
        } catch (error) {
            console.error('Error getting accounting users:', error);
            throw new Error('Failed to retrieve accounting users');
        }
    }
}