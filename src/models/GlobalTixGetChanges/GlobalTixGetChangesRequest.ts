export interface GlobalTixGetChangesRequest {
    countryId: number;
    CityID?: number;  // Optional field based on PHP implementation
    dateFrom: string;
    dateTo: string;
}

export function validateGetChangesRequest(data: any): GlobalTixGetChangesRequest {
    // Validate required fields
    if (!data.countryId) {
        throw new Error("Required field countryId is missing or has no value!");
    }
    if (!data.dateFrom) {
        throw new Error("Required field dateFrom is missing or has no value!");
    }
    if (!data.dateTo) {
        throw new Error("Required field dateTo is missing or has no value!");
    }
    
    const request: GlobalTixGetChangesRequest = {
        countryId: parseInt(String(data.countryId)),
        dateFrom: String(data.dateFrom),
        dateTo: String(data.dateTo),
    };
    
    // Add optional CityID if present
    if (data.CityID) {
        request.CityID = parseInt(String(data.CityID));
    }
    
    return request;
}