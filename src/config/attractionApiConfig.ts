import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URIS = {
    development: 'https://stg-api.globaltix.com/api',
    production: 'https://sg-api.globaltix.com/api',
};

const ENDPOINTS = {
    getProducts: '/product/list',
    getProductOptions: '/product/options',
    getProductInfo: '/product/info',
    getEventDates: '/ticketType/getAvailableDates',
    checkEventAvailability: '/ticketType/checkEventAvailability',
    getUnavailableDates: '/ticketType/getUnavailableDates',
    getProductChanges: '/product/changes',
    createTransaction: '/transaction/create',
    cancelTransaction: '/transaction/revoke',
    getBalance: '/credit/getCreditByReseller',
    globalTixAuth: '/auth/login',
}

export const getApiUrl = (key: keyof typeof ENDPOINTS): string => {
    const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const baseUri = API_BASE_URIS[env];
    const endpoint = ENDPOINTS[key];
    return `${baseUri}${endpoint}`;
};

export const getGlobalTixCredentials = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        username: isProd ? process.env.GLOBALTIX_USERNAME : process.env.GLOBALTIX_DEV_USERNAME,
        password: isProd ? process.env.GLOBALTIX_PW : process.env.GLOBALTIX_DEV_PW,
    };
};