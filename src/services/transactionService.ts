import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { GlobalTixCreateTransactionResponse } from '../models/GlobalTixCreateTransaction/GlobalTixCreateTransactionResponse';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { TransactionTypes } from '../enums/TransactionTypes';
import admin from '../utils/firebase';

const db = admin.firestore();

interface TransactionPayload {
    userId: string;
    amount: number;
    currency: string;
    type: TransactionTypes;
    createdBy: string;
    userName: string;
    meta?: Record<string, any>;
    agentId?: string;
    transactionId?: string;
}


export async function commitTransaction({
    userId,
    amount,
    currency,
    type,
    createdBy,
    userName,
    meta = {},
    agentId,
    transactionId,
}: TransactionPayload): Promise<void> {
    const now = new Date().toISOString();
  
    const transactionDoc = {
      userId,
      created_by: createdBy,
      user_name: userName,
      amount: -Math.abs(amount), // ensuring it's negative
      base_amount: -Math.abs(amount),
      currency,
      type,
      reference_no: uuidv4().slice(0, 8),
      transaction_id: transactionId || uuidv4(),
      timestamp: now,
      credit_type: 'wallet',
      meta,
      agent_id: agentId ?? null,
    };

    console.log('[commitTransaction] Creating transaction:', transactionDoc);
  
    await db
      .collection(FirebaseCollections.user_balance_transactions)
      .doc(transactionDoc.transaction_id)
      .set(transactionDoc);

    console.log('[commitTransaction] Transaction committed successfully.');
}

/**
 * Retrieves transaction data for a given transaction ID
 */
export async function getTransactionData(transactionId: string): Promise<any> {
    console.log('[getTransactionData] Fetching transaction for ID:', transactionId);

    try {
        const transactionSnapshot = await db
            .collection(FirebaseCollections.user_balance_transactions)
            .doc(transactionId)
            .get();

        if (!transactionSnapshot.exists) {
            console.log('[getTransactionData] No transaction found.');
            return null;
        }

        console.log('[getTransactionData] Transaction found:', transactionSnapshot.data());

        return transactionSnapshot.data();
    } catch (error) {
        console.error('[getTransactionData] Error:', error);
        return null;
    }
}

// In-memory cache for currency exchange rates
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
  
/*
 * Converts transaction response to requested currency
 * @param response The transaction response
 * @param targetCurrency The target currency
 * @returns Converted transaction response
 */
export const convertResponseToCurrency = async (
    response: GlobalTixCreateTransactionResponse,
    targetCurrency: string,
): Promise<any> => {
    if (!response || !response.data) {
      return response;
    }
    
    // Create a deep clone of the response
    const clonedResponse = JSON.parse(JSON.stringify(response));
    
    // Get original currency
    const originalCurrency = clonedResponse.data.currency;
    
    // Skip conversion if currencies are the same
    if (originalCurrency === targetCurrency) {
      return clonedResponse;
    }
    
    // Get exchange rate
    const exchangeRate = await getCurrencyExchangeRate(originalCurrency, targetCurrency);
    
    // Update the currency
    clonedResponse.data.currency = targetCurrency;
    
    // Convert all price fields
    if (clonedResponse.data.totalAmount !== undefined) {
      clonedResponse.data.totalAmount = roundCurrency(
        clonedResponse.data.totalAmount * exchangeRate,
        targetCurrency,
      );
    }
    
    // Convert ticket prices if they exist
    if (clonedResponse.data.tickets && Array.isArray(clonedResponse.data.tickets)) {
      for (const ticket of clonedResponse.data.tickets) {
        if (ticket.price !== undefined) {
          ticket.price = roundCurrency(ticket.price * exchangeRate, targetCurrency);
        }
        if (ticket.totalPrice !== undefined) {
          ticket.totalPrice = roundCurrency(ticket.totalPrice * exchangeRate, targetCurrency);
        }
      }
    }
    
    return clonedResponse;
};
  
/**
 * Gets currency exchange rate from cache or API
 * @param fromCurrency Source currency
 * @param toCurrency Target currency
 * @returns Exchange rate with fee applied
 */
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
  
/**
 * Rounds amount based on currency rules
 * @param amount Amount to round
 * @param currency Currency code
 * @returns Rounded amount
 */
function roundCurrency(amount: number, currency: string): number {
    // Different currencies have different rounding rules
    switch (currency) {
      case 'JPY':
        return Math.ceil(amount); // No decimals for Japanese Yen
      case 'KRW':
        return Math.ceil(amount); // No decimals for Korean Won
      default:
        // Default to 2 decimal places for most currencies
        return Math.round(amount * 100) / 100;
    }
}