export interface ProductOptionData {
    id: number;
    name: string;
    description: string;
    termsAndConditions: string;
    image?: string;
    currency: string;
    publishStart: string;
    publishEnd?: string;
    redeemStart?: string;
    redeemEnd?: string;
    ticketValidity: string;
    ticketFormat: string;
    definedDuration: number;
    isFavorited: boolean;
    fromReseller: boolean;
    isCapacity: boolean;
    timeSlot?: string;
    sourceName: string;
    sourceTitle: string;
    advanceBooking?: string;
    visitDate: VisitDate;
    questions: Question[];
    howToUse: string[];
    inclusions: string[];
    exclusions: string[];
    tourInformation: string[];
    isCancellable: boolean;
    cancellationPolicy?: string;
    cancellationNotes: string[];
    type: string;
    demandType?: string;
    ticketType: TicketType[];
    keywords?: string;
}
  
export interface VisitDate {
    request?: string;
    required?: string;
    isOpenDated?: string;
}
  
export interface Question {
    id: number;
    options: string[];
    optional: boolean;
    question: string;
    questionCode?: string;
    isAnswerLater?: boolean;
    type?: string;
}
  
export interface TicketType {
    id: number;
    sku: string;
    name: string;
    originalPrice: number;
    originalMerchantPrice: number;
    issuanceLimit?: number;
    minPurchaseQty?: number;
    maxPurchaseQty?: number;
    merchantReference: string;
    ageFrom?: number;
    ageTo?: number;
    applyToAllQna: boolean;
    nettPrice: number;
    nettMerchantPrice: number;
    minimumSellingPrice: number;
    minimumMerchantSellingPrice: number;
    recommendedSellingPrice: number;
}