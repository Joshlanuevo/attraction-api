import { Request, Response } from 'express';
import { GlobalTixCreateTransactionRequest } from '../models/GlobalTixCreateTransaction/GlobalTixCreateTransactionRequest';
import { validateGetChangesRequest } from '../models/GlobalTixGetChanges/GlobalTixGetChangesRequest';
import { handleErrorResponse } from '../middlewares/handleErrorResponse';
import AuthService from '../services/authService';
import { getProductList } from '../services/attractionGetProducts';
import { getProductOptions } from '../services/attractionGetProductOptions';
import { getProductInfo } from '../services/attractionGetProductInfo';
import { getEventDates } from '../services/attractionGetEventDates';
import { UserService } from '../services/userService';
import { checkEventAvailability } from '../services/attractionCheckEventAvailability';
import { getUnavailableDates } from '../services/attractionGetUnavailableDates';
import { getProductChanges } from '../services/attractionGetChanges';
import { AccessControlService } from '../services/accessControlService';
import { executeCreateTransaction } from '../services/attractionCreateTransaction';
import { commitTransaction, getTransactionData, convertResponseToCurrency } from '../services/transactionService';
import { checkSufficientOnHoldBalance } from '../services/userFundsService';
import { cancelTransaction } from '../services/attractionCancelTransaction';
import { hydrateTransactions } from '../services/transactionHydrationService';
import { getBalance } from '../services/attractionGetBalance';
import { BookingApprovalService } from '../services/bookingApprovalService';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { TransactionTypes } from '../enums/TransactionTypes';
import { sendResponse } from '../utils/response';
import { DEFAULT_CURRENCY, DEFAULT_COLLECTION, DEFAULT_KEY, DEFAULT_SORT_BY, DEFAULT_LIMIT } from '../utils/constant';
import { isAdmin } from '../utils/user';
import { unhash } from '../utils/cryptoUtil';
import { 
    validateGetProductsRequest, 
    validateGetDatesRequest,
    validateGetAvailabilityRequest,
    validateGetUnavailableDatesRequest,
} from '../validators/globalTixValidators';


export class AttractionsController {

    static async getProducts(req: Request, res: Response) {
        try {
            const rawParams = { ...req.query, ...req.body };
            const params = validateGetProductsRequest(rawParams);
    
            const token = await AuthService.getToken();
            const results = await getProductList(params, token);
    
            sendResponse(req, res, true, 200, 'Successfully fetched event packages.', results);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Event Package Get Products');
        }
    }

    static async getProductOptions(req: Request, res: Response) {
        try {
            const rawParams = { ...req.params, ...req.query, ...req.body };
            const id = rawParams.id;
    
            if (!id) {
                throw new Error("ID is required");
            }
    
            const token = await AuthService.getToken();
            const results = await getProductOptions(parseInt(id.toString()), token);
    
            sendResponse(req, res, true, 200, 'Successfully fetched product options.', results);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Product Options');
        }
    }

    static async getProductInfo(req: Request, res: Response) {
        try {
            const rawParams = { ...req.params, ...req.query, ...req.body };
            const id = rawParams.id;
    
            if (!id) {
                return sendResponse(req, res, false, 400, "Product ID is required", {});
            }
    
            const userCurrency = await getUserCurrency(req);
            const token = await AuthService.getToken();
            const results = await getProductInfo(parseInt(id.toString()), token, userCurrency);
    
            sendResponse(req, res, true, 200, 'Successfully fetched product info.', results);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Product Info');
        }
    }

    static async getEventDates(req: Request, res: Response) {
        try {
            const rawParams = { ...req.query, ...req.body };
            const requestParams = validateGetDatesRequest(rawParams);
    
            const token = await AuthService.getToken();
            const results = await getEventDates(requestParams, token);
    
            sendResponse(req, res, true, 200, 'Successfully fetched event dates.', results);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Event Dates');
        }
    }
    
    static async getEventAvailability(req: Request, res: Response) {
        try {
            const rawParams = { ...req.query, ...req.body };
            const validParams = validateGetAvailabilityRequest(rawParams);
    
            const token = await AuthService.getToken();
            const results = await checkEventAvailability(validParams, token);
    
            sendResponse(req, res, true, 200, 'Successfully checked event availability.', results);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Event Availability');
        }
    }

    static async getEventUnavailableDates(req: Request, res: Response) {
        try {
            const rawParams = { ...req.query, ...req.body };
            const validParams = validateGetUnavailableDatesRequest(rawParams);
    
            const token = await AuthService.getToken();
            const results = await getUnavailableDates(validParams, token);
    
            sendResponse(req, res, true, 200, 'Successfully fetched unavailable dates.', results);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Unavailable Dates');
        }
    }

    static async checkEventChanges(req: Request, res: Response) {
        try {
            const rawParams = { ...req.query, ...req.body };
            const validParams = validateGetChangesRequest(rawParams);
    
            const token = await AuthService.getToken();
            const results = await getProductChanges(validParams, token);
    
            sendResponse(req, res, true, 200, 'Successfully checked event changes.', results);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Event Changes');
        }
    }

    static async createTransaction(req: Request, res: Response): Promise<void> {
        try {
            const token = await AuthService.getToken();

            const userId = req.user?.userId;
            if (!userId) throw new Error("User not authenticated. Please log in again.");

            const userData = await UserService.getUser(userId);
            if (!userData) throw new Error("User not authenticated");

            const request = new GlobalTixCreateTransactionRequest(userData.currency, req.body);
            request.validate();

            const approvalId = req.body.approval_id;
            await AccessControlService.validateBookingApprovalCredentials(
                TransactionTypes.package,
                approvalId,
                userData,
            );

            const total = await calculateBookingTotal(request);

            if (!isAdmin(userData)) {
                const userBalance = await UserService.getUserBalanceData(userData.userId);
                if (!userBalance) throw new Error("Unable to retrieve balance information");

                const nextBalance = userBalance.total.amount - total;
                if (nextBalance < 0) {
                    return sendResponse(req, res, false, 402, "User does not have enough balance", {
                        error: "User does not have enough balance"
                    });
                }

                const onHoldCheck = await checkSufficientOnHoldBalance(
                    userData.userId,
                    { amount: nextBalance, currency: userData.currency || DEFAULT_CURRENCY },
                    true
                );

                if (onHoldCheck !== true) {
                    const code = typeof onHoldCheck === 'object' && 'code' in onHoldCheck ? onHoldCheck.code : 402;
                    const error = typeof onHoldCheck === 'object' && 'error' in onHoldCheck ? onHoldCheck.error : "Unknown error";
                    return sendResponse(req, res, false, code, error, { error });
                }
            }

            const responseModel = await executeCreateTransaction(request, token);
            const confirmationNumber = responseModel.data.reference_number;

            if (!confirmationNumber) throw new Error("Transaction failed to commit");

            const transactionPayload = {
                userId: userData.id,
                transactionId: confirmationNumber,
                amount: total,
                currency: userData.currency || DEFAULT_CURRENCY,
                type: TransactionTypes.attractions,
                createdBy: userData.id,
                userName: `${userData.first_name} ${userData.last_name}`,
                meta: {
                    response: cleanUndefinedFields(responseModel.toPlainObject()),
                    request: cleanUndefinedFields(request.toPlainObject()),
                },
                agentId: userData.agency_id || userData.id,
            };

            await commitTransaction(transactionPayload);

            const transactionData = await getTransactionData(confirmationNumber);
            const responseInUserCurrency = await convertResponseToCurrency(
                responseModel,
                userData.currency || DEFAULT_CURRENCY,
            );

            const output = {
                ...responseInUserCurrency,
                transaction: transactionData ? [transactionData] : [],
            };

            sendResponse(req, res, true, 200, "Transaction created successfully", output);

        } catch (error) {
            const trackingId = Array.isArray(req.headers['x-correlation-id'])
            ? req.headers['x-correlation-id'][0]
            : req.headers['x-correlation-id'] ?? '';

            handleErrorResponse(req, res, error, trackingId, 'Create Attraction Transaction');
        }
    }

    static async cancelTransaction(req: Request, res: Response) {
        try {
            const referenceNumber = req.query.reference_number || req.body.reference_number;
            
            if (!referenceNumber) {
                throw new Error("reference_number is required");
            }
            
            const token = await AuthService.getToken();
            const results = await cancelTransaction(referenceNumber.toString(), token);
            
            sendResponse(req, res, true, 200, 'Transaction cancelled successfully.', results);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Cancel Transaction');
        }
    }

    static async hydrateTransactions(req: Request, res: Response): Promise<void> {

        try {
            // Check if user is admin
            const userId = req.user?.userId;
            if (!userId) throw new Error("User not authenticated. Please log in again.");
            
            const user = await UserService.getUser(userId);
            if (!isAdmin(user)) {
                throw new Error("Unauthorized: Only administrators can hydrate transactions");
            }
            
            // Extract parameters from request
            const collection = (req.body.collection || DEFAULT_COLLECTION) as FirebaseCollections;
            const key = req.body.key || DEFAULT_KEY;
            const sortBy = req.body.sortBy || DEFAULT_SORT_BY;
            const limit = req.body.limit || DEFAULT_LIMIT;
            
            // Optional transformer function
            let transformer: ((item: any) => any) | undefined = undefined;
            if (req.body.transform === 'toTransaction') {
                transformer = (item: any) => {
                    // Transformer logic to convert item to transaction format
                    return {
                    ...item,
                    processed: true,
                    hydrated_at: new Date().toISOString(),
                    };
                };
            }
            
            // Trigger the hydration process
            const result = await hydrateTransactions(
                collection as FirebaseCollections,
                key,
                sortBy,
                limit,
                transformer,
            );
            
            sendResponse(req, res, true, 200, 'Transaction hydration completed successfully', {
                batches: result.length,
                totalDocuments: result.reduce((sum, batch) => sum + (batch.processedIds?.length || 0), 0),
            });
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Hydrate Transaction');
        }
    }

    static async getBalance(req: Request, res: Response) {
        try {
            const token = await AuthService.getToken();
            const results = await getBalance(token);
            
            sendResponse(req, res, true, 200, 'Successfully fetched balance.', results);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Get Balance');
        }
    }

    static async requestBookingApproval(req: Request, res: Response): Promise<void> {
        
        try {
            // Get hash from query parameters
            const hash = req.query.hash as string;
            if (!hash) {
                throw new Error("Hash is required");
            }
    
            // Unhash to get request_id
            const requestId = await unhash(hash);
            if (!requestId || hash === requestId) {
                throw new Error("Invalid hash");
            }
            
            // Get user data
            const userId = req.user?.userId;
            if (!userId) throw new Error("User not authenticated. Please log in again.");

            const userData = await UserService.getUser(userId);
            
            if (!userData) {
                throw new Error("User not authenticated");
            }
            
            // Create and validate request
            const request = new GlobalTixCreateTransactionRequest(userData.currency, req.body);
            request.validate();
            
            // Calculate total
            const total = await calculateBookingTotal(request);
            
            // Check user balance if not admin
            if (!isAdmin(userData)) {
                await UserService.validateUserBalance(
                    userData.id, 
                    total, 
                    userData.currency || DEFAULT_CURRENCY,
                );
            }
            
            // Count tickets and get ticket names
            let ticketCount = 0;
            let ticketNames = "";
            
            if (req.body.ticketTypes && Array.isArray(req.body.ticketTypes) && req.body.ticketTypes.length > 0) {
                ticketCount = req.body.ticketTypes.length;
                
                const ticketNamesArr = req.body.ticketTypes.map((ticket: any) => {
                    const productName = ticket.product_info?.name || '';
                    const ticketName = ticket.product_info?.ticket_name || '';
                    return `${productName} - ${ticketName}`;
                }).filter((name: string) => name.trim() !== ' - ');
                
                ticketNames = ticketNamesArr.join(", ");
            }
            
            // Format cost
            const cost = `${userData.currency || DEFAULT_CURRENCY} ${total}`;
            
            // Prepare request object
            const approvalRequest = {
                "Type": "Attractions",
                "Total Cost": cost,
                "Ticket Types": ticketNames,
                "No. of Tickets": ticketCount,
            };
            
            // Send booking approval request
            const result = await BookingApprovalService.sendBookingApprovalRequest(
                req,
                requestId,
                cost,
                approvalRequest,
            );
            
            sendResponse(req, res, true, 200, 'Booking approval request sent successfully', result);
        } catch (error) {
            const trackingId = (Array.isArray(req.headers["x-correlation-id"])
                ? req.headers["x-correlation-id"][0]
                : req.headers["x-correlation-id"]) ?? '';
            handleErrorResponse(req, res, error, trackingId, 'Request Booking Approval');
        }
    }
}


/**
 * Helper function to extract user currency from various sources
 */
async function getUserCurrency(req: Request): Promise<string | undefined> {
    return req.user?.currency;
}
  
async function calculateBookingTotal(request: GlobalTixCreateTransactionRequest): Promise<number> {
    let total = 0;
    
    // Sum up all ticket prices
    if (request.ticketTypes && Array.isArray(request.ticketTypes)) {
      for (const ticketType of request.ticketTypes) {
        if (ticketType.sellingPrice && ticketType.quantity) {
          total += (ticketType.sellingPrice * ticketType.quantity);
        }
      }
    }
    
    return total;
}

function cleanUndefinedFields(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(cleanUndefinedFields);
    } else if (obj && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = cleanUndefinedFields(value);
            }
            return acc;
        }, {} as Record<string, any>);
    }
    return obj;
}