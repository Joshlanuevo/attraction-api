/**
 * Interface for raw product data from the API response
 */
export interface RawProductData {
    country?: string;
    originalPrice?: string | number;
    keywords?: string | null;
    fromPrice?: string | number;
    city?: string;
    currency?: string;
    id?: string | number;
    isGTRecommend?: boolean;
    image?: string;
    isOpenDated?: boolean;
    isOwnContracted?: boolean;
    merchant?: {
      id?: string | number;
      name?: string;
    };
    isFavorited?: boolean;
    isBestSeller?: boolean;
    fromReseller?: string | null;
    name?: string;
    isInstantConfirmation?: boolean;
    category?: string;
  }