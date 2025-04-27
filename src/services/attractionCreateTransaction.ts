import axios from "axios";
import { GlobalTixCreateTransactionRequest } from "../models/GlobalTixCreateTransaction/GlobalTixCreateTransactionRequest";
import { GlobalTixCreateTransactionResponse } from "../models/GlobalTixCreateTransaction/GlobalTixCreateTransactionResponse";
import { getApiUrl } from "../config/attractionApiConfig";
import { DEFAULT_CURRENCY } from "../utils/constant";

export const executeCreateTransaction = async (
    request: GlobalTixCreateTransactionRequest,
    token: string,
): Promise<GlobalTixCreateTransactionResponse> => {
    const url = getApiUrl('createTransaction');

    try {
        const response = await axios.post(url, request, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const body = response.data;
        
        // Validate response
        if (body.error_message) {
          throw new Error(body.error_message);
        }
        
        if (!body || typeof body !== 'object') {
          throw new Error("Invalid response from Third Party API");
        }
        
        if (body.error) {
          throw new Error(`Error: ${body.error.code} - ${body.error.message}`);
        }
        
        if (!body.success) {
          throw new Error(`Error: ${JSON.stringify(body)}`);
        }
        
        // Create response model
        const responseModel = new GlobalTixCreateTransactionResponse(
          body.data?.currency || DEFAULT_CURRENCY,
          body,
        );
        
        return responseModel;
    } catch (error) {
        if (axios.isAxiosError(error)) {
          const errorData = error.response?.data;
          throw new Error(`API Error: ${JSON.stringify(errorData || error.message)}`);
        }
        throw error;
    }
}