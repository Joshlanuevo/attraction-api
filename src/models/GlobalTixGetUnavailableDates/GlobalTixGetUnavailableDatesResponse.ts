export interface DateStatus {
    date: string;
    status: string;
}

export interface GlobalTixGetUnavailableDatesResponse {
    data: DateStatus[];
    error?: any;
    size: number;
    success: boolean;
}