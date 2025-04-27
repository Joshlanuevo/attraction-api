import { Request } from 'express';
import axios from 'axios';
import dotenv from "dotenv";
import bcryptUtil from "../utils/bcrypt";
import jwtUtil from "../utils/jwt";
import { UserData } from '../models/User/UserData';
import { UserModel } from '../models/User/UserModel';
import { GlobalTixAuthRequest } from '../models/GlobalTixAuth/GlobalTixAuthRequest';
import { GlobalTixAuthResponse } from '../models/GlobalTixAuth/GlobalTixAuthResponse';
import { GlobalTixErrorResponse } from '../models/GlobalTixErrorResponse';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { getApiUrl } from '../config/attractionApiConfig';
import { getValue } from '../utils/helpers';
import admin from '../utils/firebase';

dotenv.config();

const db = admin.firestore();
const ATTRACTION_AUTH_COLLECTION = "AttractionAuthTokens";
const TOKEN_DOC_ID = "currentToken";
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '30000', 10);

class AuthService {

    /**
     * Request a new authentication token from the external API
     */
    async requestToken(): Promise<string> {
        try {
            const attractionAuthUrl = getApiUrl('globalTixAuth');
            const requestModel = new GlobalTixAuthRequest();

            console.log(`Requesting auth token from ${attractionAuthUrl}`);
            console.log("Using username:", requestModel.username);
            console.log("Auth endpoint:", attractionAuthUrl);
            
            const result = await axios.post(attractionAuthUrl, requestModel, {
                headers: { 'Content-Type': 'application/json' },
                timeout: API_TIMEOUT,
            });
            const responseData = result.data;

            console.log("Full auth response:", JSON.stringify(responseData));

            // Check if result.data has error_message (similar to PHP implementation)
            if (getValue(result, "error_message")) {
                const errorModel = new GlobalTixErrorResponse(responseData);
                throw new Error(`Error: ${errorModel.error.code} - ${errorModel.error.message}`);
            }

            // Check if response body is valid (similar to PHP implementation)
            if (!responseData) {
                throw new Error("Invalid response from Third Party API");
            }

            // Check for error status (similar to PHP implementation)
            if (getValue(responseData, "status")) {
                throw new Error(this.formatErrorMessage(responseData));
            }

            const authResponse = new GlobalTixAuthResponse(responseData);
            if (!authResponse?.data?.access_token) {
                throw new Error(`Error: No access token found in response: ${JSON.stringify(result.data)}`);
            }

            await this.storeToken(authResponse.data.access_token, authResponse.data.expires_in || 3600);
            return authResponse.data.access_token;
        } catch (error) {
            // Improved error handling
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const errorData = error.response?.data;
                
                console.error('Attraction auth request failed:', {
                    status,
                    data: errorData,
                    message: error.message
                });
                
                // More specific error messages based on response
                if (status === 400 && errorData?.detail) {
                    throw new Error(`Authentication error: ${errorData.detail}`);
                } else if (status === 401) {
                    throw new Error('Invalid credentials provided for attraction API');
                }
            }
            
            console.error('Attraction auth request failed:', error);
            throw error;
        }
    }

    /**
     * Store token in Firestore with expiration
     */
    private async storeToken(token: string, expiresIn: number): Promise<void> {
        try {
            const expiresAt = new Date(Date.now() + (expiresIn - 300) * 1000); // 5-minute buffer
            await db.collection(ATTRACTION_AUTH_COLLECTION).doc(TOKEN_DOC_ID).set({
                token,
                expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
                createdAt: admin.firestore.Timestamp.now()
            });
        } catch (error) {
            console.error('Error storing token:', error);
            throw error;
        }
    }

    /**
     * Get a valid token, either from cache or by requesting a new one
     */
    async getToken(): Promise<string> {
        try {
            const tokenDoc = await db.collection(ATTRACTION_AUTH_COLLECTION).doc(TOKEN_DOC_ID).get();
            
            if (tokenDoc.exists) {
                const { token, expiresAt } = tokenDoc.data() || {};
                if (token && expiresAt?.toDate() > new Date()) {
                    console.log('Using cached attraction auth token');
                    return token;
                }
            }
            
            console.log('Requesting new attraction auth token');
            return await this.requestToken();
        } catch (error) {
            console.error('Error getting attraction auth token:', error);
            throw new Error('Failed to get authentication token for attraction API');
        }
    }

    async validateUser(email: string, password: string): Promise<UserModel | null> {
        const user = await this.getUserByEmail(email);
        if (!user || user.length === 0) return null;
        console.log("Raw user data from Firestore:", user[0]);
        return (await bcryptUtil.compareData(password, user[0].bcryptPassword)) ? new UserModel(user[0]) : null;
    }

    public async updateUserPassword(userId: string, password: string) {
        try {
            const hashedPassword = await bcryptUtil.hashData(password);
            await db.collection('users').doc(userId).update({ bcryptPassword: hashedPassword });
            return true;
        } catch (error) {
            console.error('Error updating user password:', error);
            return false;
        }
    }

    generateAuthToken(userData: UserData): string {
        if (!userData) throw new Error('User data is required to generate token.');
        return jwtUtil.generateToken({
            userId: userData.id || '',
            status: userData.status || '',
            role: userData.type || '',
            agency_id: userData.agency_id || '',
            country_name: userData.country_name || '',
            region_name: userData.region_name || '',
            currency: userData.currency || '',
        });
    }

    private async getUserByEmail(email: string) {
        try {
            const usersRef = db.collection(FirebaseCollections.users);
            const querySnapshot = await usersRef.where('email', '==', email).get();
            return querySnapshot.empty ? null : querySnapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    /**
     * Format error messages similar to the PHP implementation
     */
    private formatErrorMessage(errorModel: any): string {
        let errorMsg = `Error: ${errorModel.title} - ${errorModel.detail}`;
        return errorMsg.includes('sensitive') || errorMsg.includes('internal')
            ? "Please contact support@pinoyonlinebiz.com for assistance."
            : errorMsg;
    }
}

export default new AuthService();
