import { FundsOnHold } from "../models/FundsOnHold/FundsOnHold";
import { FirebaseCollections } from "../enums/FirebaseCollections";
import admin from "../utils/firebase";

const db = admin.firestore();

/**
 * Retrieves the total amount of funds on hold for a specific user and currency
 */
export async function getUserFundsOnHold(
  userId: string, 
  currency: string,
  trackingId?: string
): Promise<number> {
  if (!userId) {
    throw new Error("User ID is required to get funds on hold.");
  }

  console.log(`[getUserFundsOnHold] TrackingID: ${trackingId ?? 'N/A'} - Fetching on-hold funds for user ${userId} in ${currency}`);

  try {
    const snapshot = await db
      .collection(FirebaseCollections.user_funds_on_hold)
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) {
      console.log(`[getUserFundsOnHold] No funds on hold found for user ${userId}`);
      return 0;
    }

    let totalOnHold = 0;
    snapshot.forEach(doc => {
      const data = doc.data() as FundsOnHold;
      if (data.currency === currency) {
        totalOnHold += Number(data.amount);
      }
    });

    console.log(`[getUserFundsOnHold] Total on-hold for user ${userId}: ${totalOnHold} ${currency}`);
    return totalOnHold;
  } catch (error) {
    console.error(`[getUserFundsOnHold] Error fetching funds on hold:`, error);
    throw error;
  }
}

/**
 * Checks if the user has sufficient balance considering both available funds and on-hold funds
 */
export async function checkSufficientOnHoldBalance(
  userId: string,
  currentBalance: number,
  pendingDebit: number,
  currency: string,
  trackingId?: string
): Promise<boolean> {
  console.log(`[checkSufficientOnHoldBalance] TrackingID: ${trackingId ?? 'N/A'} - Checking balance for user ${userId}`);
  console.log(`[checkSufficientOnHoldBalance] Current Balance: ${currentBalance}, Pending Debit: ${pendingDebit}, Currency: ${currency}`);

  try {
    const fundsOnHold = await getUserFundsOnHold(userId, currency, trackingId);

    if (fundsOnHold > 0) {
      const nextBalance = currentBalance - pendingDebit - fundsOnHold;
      console.log(`[checkSufficientOnHoldBalance] Calculated next balance: ${nextBalance}`);

      if (nextBalance < 0) {
        console.log(`[checkSufficientOnHoldBalance] Insufficient balance for user ${userId}`);
        return false;
      }
    }

    console.log(`[checkSufficientOnHoldBalance] Sufficient balance for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[checkSufficientOnHoldBalance] Error checking balance:`, error);
    throw error;
  }
}