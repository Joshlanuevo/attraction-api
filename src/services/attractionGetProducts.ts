import axios from "axios";
import dotenv from "dotenv";
import { GlobalTixErrorResponse } from "../models/GlobalTixErrorResponse";
import { GlobalTixGetProductsRequest, GlobalTixGetProductsResponse } from "../models/GlobalTixGetProducts/GlobalTixGetProducts";
import { getApiUrl } from "../config/attractionApiConfig";
import { mapProductData } from "../utils/helpers";

dotenv.config();

/**
 * Fetches product list from GlobalTix API
 * @param query Request parameters
 * @param token Authentication token
 * @returns Formatted product data response
 */
export const getProductList = async (
  query: GlobalTixGetProductsRequest,
  token: string,
): Promise<GlobalTixGetProductsResponse> => {
  const url = getApiUrl('getProducts');

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: query,
    });

    const body = response.data;

    // Handle API errors
    if (body?.error) {
      throw new Error(`GlobalTix error: ${body.error?.message || JSON.stringify(body.error)}`);
    }
  
    // Validate response format
    if (!Array.isArray(body?.data)) {
      throw new Error('Invalid response from GlobalTix API: data is not an array');
    }

    if (body.error) {
      const errorResponse = new GlobalTixErrorResponse(body);
      throw new Error(`Error: ${errorResponse.error.code} - ${errorResponse.error.message}`);
    }

    const currency = body.data?.[0]?.currency || '';
    const mappedProductData = body.data.map(mapProductData);

    return {
      success: body.success || true,
      data: mappedProductData,
      error: body.error || undefined,
      size: mappedProductData.length,
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