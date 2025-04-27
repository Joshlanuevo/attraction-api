import { GlobalTixGetProductsRequest } from "../models/GlobalTixGetProducts/GlobalTixGetProducts";
import { GlobalTixGetDatesRequest } from "../models/GlobalTixGetDates/GlobalTixGetDatesRequest";
import { GlobalTixGetAvailabilityRequest } from "../models/GlobalTixGetAvailability/GlobalTixGetAvailabilityRequest";
import { GlobalTixGetUnavailableDatesRequest } from "../models/GlobalTixGetUnavailableDates/GlobalTixGetUnavailableDatesRequest";

export function validateGetProductsRequest(data: any): GlobalTixGetProductsRequest {
    const request: GlobalTixGetProductsRequest = {
        countryId: data.countryId,
        cityIds: data.cityIds || 'all',
        categoryIds: data.categoryIds || 'all',
        searchText: data.searchText || undefined,
        page: parseInt(data.page) || 1,
        section: parseInt(data.section) || 0,
        Lang: data.Lang || 'EN',
    };

    if (isNaN(request.page!) || request.page! <= 0) {
        throw new Error('Page number must be a positive number');
    }

    return request;
}

export function validateGetDatesRequest(data: any): GlobalTixGetDatesRequest {
    const optionID = parseInt(String(data.optionID || 0));
    if (!optionID || isNaN(optionID)) {
        throw new Error("Required field optionID is missing or has no value!");
    }

    const request: GlobalTixGetDatesRequest = {
        optionID,
    };

    if (data.ticketTypeID) {
        request.ticketTypeID = parseInt(String(data.ticketTypeID));
    }

    if (data.dateFrom) {
        request.dateFrom = String(data.dateFrom);
    }

    if (data.dateTo) {
        request.dateTo = String(data.dateTo);
    }

    return request;
}

export function validateGetAvailabilityRequest(data: any): GlobalTixGetAvailabilityRequest {
    // Validate required fields
    if (!data.id) {
        throw new Error("Required field id is missing or has no value!");
    }
    if (!data.date) {
        throw new Error("Required field date is missing or has no value!");
    }
    
    return {
        id: parseInt(String(data.id)),
        date: String(data.date)
    };
}

export function validateGetUnavailableDatesRequest(data: any): GlobalTixGetUnavailableDatesRequest {
    // Validate required fields
    if (!data.id) {
        throw new Error("Required field id is missing or has no value!");
    }
    if (!data.date_from) {
        throw new Error("Required field date_from is missing or has no value!");
    }
    if (!data.date_to) {
        throw new Error("Required field date_to is missing or has no value!");
    }
    
    return {
        id: parseInt(String(data.id)),
        date_from: String(data.date_from),
        date_to: String(data.date_to)
    };
}