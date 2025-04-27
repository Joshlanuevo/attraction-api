export interface Merchant {
    name: string;
    id: number;
}
  
export interface OperatingHours {
    fixedDays: any[];
    isToursActivities?: boolean;
    custom: string;
}
  
export interface ProductInfoData {
    country: string;
    originalPrice: number;
    keywords?: string;
    blockedDate: any[];
    fromPrice: number;
    city: string;
    description: string;
    media: any[];
    countryId: number;
    timezoneOffset: number;
    currency: string;
    id: number;
    isGTRecommend: boolean;
    image: string;
    isOpenDated: boolean;
    isOwnContracted: boolean;
    merchant: Merchant;
    isFavorited: boolean;
    isBestSeller: boolean;
    fromReseller?: string;
    highlights: any[];
    operatingHours: OperatingHours;
    name: string;
    isInstantConfirmation: boolean;
    category: string;
    thingsToNote: any[];
    [key: string]: any;
}
  
export interface GlobalTixProductInfoResponse {
    data: ProductInfoData;
    error?: any;
    size: number;
    success: boolean;
}