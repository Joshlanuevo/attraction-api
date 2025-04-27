import axios from "axios";
import { GlobalTixErrorResponse } from "../models/GlobalTixErrorResponse";
import { FormattedBalanceResponse, GetBalanceResponse } from "../models/GlobalTixGetBalance/GlobalTixGetBalanceResponse";
import { getApiUrl } from "../config/attractionApiConfig";

/**
 * Fetches the current balance from the GlobalTix API
 * @param token Auth token for API access
 * @returns Formatted balance information
 */
export async function getBalance(token: string): Promise<FormattedBalanceResponse> {
    try {
        const apiUrl = getApiUrl('getBalance');
        
        const response = await axios.get<GetBalanceResponse>(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        
        const data = response.data;
        
        if (!data) {
            throw new Error("Invalid response from Third Party API");
        }
        
        if (data.error) {
            throw new Error(`Error: ${data.error.code} - ${data.error.message}`);
        }
        
        if (!data.success) {
            throw new Error(`Error: ${JSON.stringify(data)}`);
        }
        
        // Based on actual API response structure
        const currency = data.data.currency;
        let balance = data.data.balance;
        
        // Convert to number if it's a string
        if (typeof balance === 'string') {
            if (typeof balance === 'string') {
                balance = parseFloat((balance as string).replace(/[^0-9.]/g, '')) || 0;
            }
        } else {
            balance = Number(balance) || 0;
        }

        // Round UP to 2 decimal places to match PHP's RoundingMode::UP
        balance = Math.ceil(balance * 100) / 100;
        
        return {
            currency: currency,
            balance: balance,
            rate: null,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorData = error.response?.data;
          if (errorData && errorData.error) {
            const errorResponse = new GlobalTixErrorResponse(errorData);
            throw new Error(`Error: ${errorResponse.error.code} - ${errorResponse.error.message}`);
          }
          throw new Error(`API request failed: ${error.message} - ${JSON.stringify(error.response?.data || {})}`);
        }
        throw error;
    }
}