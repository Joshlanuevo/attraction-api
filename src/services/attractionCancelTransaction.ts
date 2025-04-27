import axios from "axios";
import { GlobalTixErrorResponse } from "../models/GlobalTixErrorResponse";
import { CancelTransactionResponse } from "../models/GlobalTixCancelTransaction/GlobalTixCancelTransactionResponse";
import { getApiUrl } from "../config/attractionApiConfig";

/**
 * Cancels a transaction using the reference number
 * @param referenceNumber The reference number of the transaction to cancel
 * @param token Auth token for API access
 * @returns Response from the API
 */
export async function cancelTransaction(
    referenceNumber: string, 
    token: string
): Promise<CancelTransactionResponse> {
    try {
        const apiUrl = getApiUrl('cancelTransaction');
        
        const response = await axios.get(apiUrl, {
            params: { reference_number: referenceNumber },
            headers: {
                'Authorization': `Bearer ${token}`
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
        
        return data as CancelTransactionResponse;
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