export interface GlobalTixGetDatesRequest {
    optionID: number;
    ticketTypeID?: number;
    dateFrom?: string;
    dateTo?: string;
    [key: string]: any; // For additional properties
}