export interface GetBalanceResponse {
    data: {
        id: number;
        lastModified: string;
        currency: string;
        balance: number;
        totalUsage: number;
        totalTopUp: number;
        lastMonthUsage: number;
        hasOutstandingDebt: boolean;
        reseller: {
            name: string;
            id: number;
        };
        otherBalance: Array<{
            content: {
                parent_reseller_id: number;
                name: string;
                current_balance: number;
                code: string;
                credit_limit: number;
            }
        }>;
    };
    error: any;
    size: any;
    success: boolean;
}

export interface FormattedBalanceResponse {
    currency: string;
    balance: number;
    rate: null;
}