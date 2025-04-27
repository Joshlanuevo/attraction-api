import axios from "axios";
import { getApiUrl } from "../config/attractionApiConfig";
import { GlobalTixErrorResponse } from "../models/GlobalTixErrorResponse";
import { GlobalTixProductOptionsResponse } from "../models/GlobalTixProductOptions/GlobalTixProductOptionsResponse";
import { mapProductOptionData } from "../utils/helpers";

/**
 * Fetches product options from GlobalTix API
 * @param id Product ID
 * @param token Authentication token
 * @returns Formatted product options response
 */
export const getProductOptions = async (
  id: number | string,
  token: string,
): Promise<GlobalTixProductOptionsResponse> => {
  const url = getApiUrl('getProductOptions');

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { id },
    });

    const body = response.data;
    
    // Check if response has an error message
    if (body.error_message) {
      throw new Error(body.error_message);
    }
    
    // Check if response body is valid
    if (!Array.isArray(body?.data)) {
      throw new Error("Invalid response from Third Party API");
    }
    
    // Handle API errors using GlobalTixErrorResponse
    if (body.error) {
      const errorResponse = new GlobalTixErrorResponse(body);
      throw new Error(`Error: ${errorResponse.error.code} - ${errorResponse.error.message}`);
    }
    
    // Check if data is available
    if (!body.data || body.data.length === 0) {
      throw new Error("Sorry, product is currently not available.");
    }

    const currency = body.data[0]?.currency || '';
    
    // Map the response data
    const mappedProductOptionData = body.data.map(mapProductOptionData);

    return {
      success: body.success || false,
      data: mappedProductOptionData,
      size: mappedProductOptionData.length,
      currency: currency,
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
};