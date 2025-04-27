import axios from "axios";
import { GlobalTixGetUnavailableDatesRequest } from "../models/GlobalTixGetUnavailableDates/GlobalTixGetUnavailableDatesRequest";
import { DateStatus, GlobalTixGetUnavailableDatesResponse } from "../models/GlobalTixGetUnavailableDates/GlobalTixGetUnavailableDatesResponse";
import { GlobalTixErrorResponse } from "../models/GlobalTixErrorResponse";
import { getApiUrl } from "../config/attractionApiConfig";

export const getUnavailableDates = async (
    params: GlobalTixGetUnavailableDatesRequest,
    token: string,
): Promise<GlobalTixGetUnavailableDatesResponse> => {
    const url = getApiUrl('getUnavailableDates');

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params,
        });

        const body = response.data;

        // Handle API errors
        if (body?.error) {
            throw new Error(`GlobalTix error: ${body.error?.message || JSON.stringify(body.error)}`);
        }

        if (!body || !Array.isArray(body.data)) {
            throw new Error("Invalid response from Third Party API");
        }

        // Transform the data similar to PHP's DateStatus class
        const transformedData: DateStatus[] = Array.isArray(body.data) 
            ? body.data.map((item: any) => ({
                date: item.date || '',
                status: item.status || ''
              }))
            : [];

        return {
            success: body.success || true,
            data: transformedData,
            error: body.error || undefined,
            size: transformedData.length,
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