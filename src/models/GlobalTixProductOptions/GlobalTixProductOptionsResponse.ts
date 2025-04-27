import { ProductOptionData } from './GlobalTixProductOptions';

export interface GlobalTixProductOptionsResponse {
    success: boolean;
    data: ProductOptionData[];
    error?: string;
    size: number;
    currency?: string;
}