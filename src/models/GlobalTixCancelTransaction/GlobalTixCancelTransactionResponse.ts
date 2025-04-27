interface Ticket {
    code: string;
    redeemed: boolean;
}

interface CancelTransactionData {
    tickets: Ticket[];
}

export interface CancelTransactionResponse {
    data: CancelTransactionData;
    error: any;
    size: number;
    success: boolean;
}