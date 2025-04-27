import axios from "axios";
import { GlobalTixErrorResponse } from "../models/GlobalTixErrorResponse";
import { GlobalTixProductInfoResponse } from "../models/GlobalTixProductInfo/GlobalTixProductInfoResponse";
import { getApiUrl } from "../config/attractionApiConfig";

/**
 * Fetches product info from GlobalTix API
 * @param id Product ID
 * @param token Authentication token
 * @param userCurrency Optional user currency for price conversion
 * @returns Formatted product info response
 */
export const getProductInfo = async (
  id: number | string,
  token: string,
  userCurrency?: string,
): Promise<GlobalTixProductInfoResponse> => {
  const url = getApiUrl('getProductInfo');

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { id },
    });

    const body = response.data;
    
    // Validate API response
    validateApiResponse(body);
    
    // Check if the data object exists
    if (!body.data) {
      throw new Error("API response missing data object");
    }
    
    // Handle currency conversion if needed
    if (userCurrency && body.data.currency !== userCurrency) {
      return await convertProductCurrency(body, userCurrency);
    }

    return {
      success: body.success,
      data: body.data,
      size: body.size || 0,
      error: body.error,
    };
  } catch (error) {
    handleApiError(error);
  }
};

/**
 * Validates the API response structure
 */
function validateApiResponse(body: any): void {
  // Check if response has an error message
  if (body.error_message) {
    throw new Error(body.error_message);
  }
  
  // Check if response body is valid
  if (!body || typeof body !== 'object') {
    throw new Error("Invalid response from Third Party API");
  }
  
  // Handle API errors using GlobalTixErrorResponse
  if (body.error) {
    const errorResponse = new GlobalTixErrorResponse(body);
    throw new Error(`Error: ${errorResponse.error.code} - ${errorResponse.error.message}`);
  }
  
  // Check if the response was successful
  if (!body.success) {
    throw new Error(`Error: ${JSON.stringify(body)}`);
  }
}

/**
 * Handles various types of API errors
 */
function handleApiError(error: any): never {
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

/**
 * Converts product prices to requested currency
 */
async function convertProductCurrency(
  productData: GlobalTixProductInfoResponse, 
  targetCurrency: string,
): Promise<GlobalTixProductInfoResponse> {
  // Create a deep clone of the product data
  const convertedData = JSON.parse(JSON.stringify(productData));
  
  // Get original currency
  const originalCurrency = convertedData.data.currency;
  
  // Skip conversion if currencies are the same
  if (originalCurrency === targetCurrency) {
    return convertedData;
  }
  
  // Get exchange rate
  const exchangeRate = await getCurrencyExchangeRate(originalCurrency, targetCurrency);
  
  // Update the currency
  convertedData.data.currency = targetCurrency;
  
  // Convert all price fields
  if (convertedData.data.originalPrice !== undefined) {
    convertedData.data.originalPrice = roundCurrency(
      convertedData.data.originalPrice * exchangeRate,
      targetCurrency,
    );
  }
  
  if (convertedData.data.fromPrice !== undefined) {
    convertedData.data.fromPrice = roundCurrency(
      convertedData.data.fromPrice * exchangeRate,
      targetCurrency,
    );
  }
  
  return convertedData;
}

/**
 * In-memory cache for currency exchange rates
 */
const currencyRateCache = {
  store: new Map<string, { value: number, expiry: number }>(),
  
  get(key: string): number | null {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  },
  
  set(key: string, value: number, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiry });
  }
};

async function getCurrencyExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  // Check if we have this rate in cache
  const cacheKey = `currency:${fromCurrency}:${toCurrency}`;
  const cachedRate = currencyRateCache.get(cacheKey);
  
  if (cachedRate) {
    return cachedRate;
  }
  
  try {
    // Call exchange rate API
    const apiKey = process.env.EXCHANGERATE_API;
    const url = `https://api.exchangeratesapi.io/v1/convert?access_key=${apiKey}&from=${fromCurrency}&to=${toCurrency}&amount=1`;
    
    const response = await axios.get(url);
    
    if (!response.data || !response.data.success) {
      throw new Error('Failed to get exchange rate');
    }
    
    const rate = response.data.info.rate;
    
    // Add fee just like in PHP code
    const feeRate = 0.02; // 2% fee
    const rateWithFee = rate + (rate * feeRate);
    
    // Cache the rate (1 hour TTL like in PHP)
    currencyRateCache.set(cacheKey, rateWithFee, 3600);
    
    return rateWithFee;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw new Error('Unable to fetch currency exchange rate');
  }
}

function roundCurrency(amount: number, currency: string): number {
  // Different currencies have different rounding rules
  switch (currency) {
    case 'JPY':
      return Math.ceil(amount); // No decimals for Japanese Yen
    case 'KRW':
      return Math.ceil(amount); // No decimals for Korean Won
    default:
      // Use Math.ceil for 2 decimal places to match PHP's RoundingMode::UP
      return Math.ceil(amount * 100) / 100;
  }
}