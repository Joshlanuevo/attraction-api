export interface GlobalTixGetProductsRequest {
    countryId: string;
    cityIds?: string;
    categoryIds?: string;
    searchText?: string;
    page?: number;
    section?: number;
    Lang?: string;
}
  
export interface GlobalTixGetProductsResponse {
    success: boolean;
    data: ProductData[];
    error?: string;
    size: number;
    currency?: string;
}

export interface ProductData {
    country: string;
    originalPrice: number;
    keywords?: string;
    fromPrice: number;
    city: string;
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
    name: string;
    isInstantConfirmation: boolean;
    category: string;
}

export interface Merchant {
    id: number;
    name: string;
}