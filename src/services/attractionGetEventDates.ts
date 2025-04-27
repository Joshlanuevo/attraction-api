import axios from 'axios';
import { GlobalTixErrorResponse } from '../models/GlobalTixErrorResponse';
import { GlobalTixGetDatesRequest } from '../models/GlobalTixGetDates/GlobalTixGetDatesRequest';
import { GlobalTixGetDatesResponse } from '../models/GlobalTixGetDates/GlobalTixGetDatesResponse';
import { getApiUrl } from '../config/attractionApiConfig';

/**
 * Fetches available event dates from GlobalTix API
 * @param request Request parameters
 * @param token Authentication token
 * @returns Available dates response
 */
export const getEventDates = async (
    request: GlobalTixGetDatesRequest,
    token: string,
): Promise<GlobalTixGetDatesResponse> => {
    const url = getApiUrl('getEventDates');

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: request,
        });

        const body = response.data;

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

        return {
            success: body.success,
            data: body.data || [],
            size: body.data?.length || 0,
            error: body.error,
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