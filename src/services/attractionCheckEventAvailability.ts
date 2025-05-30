import axios from "axios";
import { GlobalTixGetAvailabilityRequest } from "../models/GlobalTixGetAvailability/GlobalTixGetAvailabilityRequest";
import { GlobalTixGetAvailabilityResponse } from "../models/GlobalTixGetAvailability/GlobalTixGetAvailabilityResponse";
import { GlobalTixErrorResponse } from "../models/GlobalTixErrorResponse";
import { getApiUrl } from "../config/attractionApiConfig";

export const checkEventAvailability = async (
    params: GlobalTixGetAvailabilityRequest,
    token: string,
): Promise<GlobalTixGetAvailabilityResponse> => {
    const url = getApiUrl('checkEventAvailability');

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params,
        });

        const body = response.data;

        if (body?.error) {
            throw new Error(`GlobalTix error: ${body.error?.message || JSON.stringify(body.error)}`);
        }

        if (!body) {
            throw new Error("Invalid response from Third Party API");
        }

        return {
            success: body.success || true,
            data: body.data || [],
            error: body.error || undefined,
            size: Array.isArray(body.data) ? body.data.length : 0,
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