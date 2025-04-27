import { ProductData } from '../models/GlobalTixGetProducts/GlobalTixGetProducts';
import { RawProductData } from '../models/GlobalTixGetProducts/RawProductData';
import { ProductOptionData, VisitDate, Question, TicketType } from '../models/GlobalTixProductOptions/GlobalTixProductOptions';
import { RawProductOption } from '../models/GlobalTixProductOptions/RawProductOption';

export function isFullArray(value: any): boolean {
    if (!value) return false;
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    return false;
}

export function getValue(obj: any, path: string, defaultValue: any = null): any {
    return path.split('.').reduce((o, i) => (o && o[i] !== undefined) ? o[i] : defaultValue, obj);
}

// Helper function to map raw product data to structured format
export function mapProductData(item: RawProductData): ProductData {
  return {
    country: item.country || "",
    originalPrice: parseFloat(String(item.originalPrice || 0)),
    keywords: item.keywords || undefined,
    fromPrice: parseFloat(String(item.fromPrice || 0)),
    city: item.city || "",
    currency: item.currency || "",
    id: parseInt(String(item.id || 0)),
    isGTRecommend: !!item.isGTRecommend,
    image: item.image || "",
    isOpenDated: !!item.isOpenDated,
    isOwnContracted: !!item.isOwnContracted,
    merchant: {
      id: parseInt(String(item.merchant?.id || 0)),
      name: item.merchant?.name || ""
    },
    isFavorited: !!item.isFavorited,
    isBestSeller: !!item.isBestSeller,
    fromReseller: item.fromReseller || undefined,
    name: item.name || "",
    isInstantConfirmation: !!item.isInstantConfirmation,
    category: item.category || "",
  };
}

// Helper function to map the product option data
export function mapProductOptionData(item: RawProductOption): ProductOptionData {
  return {
    id: parseInt(String(item.id || 0)),
    name: item.name || "",
    description: item.description || "",
    termsAndConditions: item.termsAndConditions || "",
    image: item.image || undefined,
    currency: item.currency || "",
    publishStart: item.publishStart || "",
    publishEnd: item.publishEnd || undefined,
    redeemStart: item.redeemStart || undefined,
    redeemEnd: item.redeemEnd || undefined,
    ticketValidity: item.ticketValidity || "",
    ticketFormat: item.ticketFormat || "",
    definedDuration: parseInt(String(item.definedDuration || 0)),
    isFavorited: !!item.isFavorited,
    fromReseller: !!item.fromReseller,
    isCapacity: !!item.isCapacity,
    timeSlot: item.timeSlot || undefined,
    sourceName: item.sourceName || "",
    sourceTitle: item.sourceTitle || "",
    advanceBooking: item.advanceBooking || undefined,
    visitDate: mapVisitDate(item.visitDate || {}),
    questions: Array.isArray(item.questions) ? item.questions.map(mapQuestion) : [],
    howToUse: Array.isArray(item.howToUse) ? item.howToUse : [],
    inclusions: Array.isArray(item.inclusions) ? item.inclusions : [],
    exclusions: Array.isArray(item.exclusions) ? item.exclusions : [],
    tourInformation: Array.isArray(item.tourInformation) ? item.tourInformation : [],
    isCancellable: !!item.isCancellable,
    cancellationPolicy: item.cancellationPolicy || undefined,
    cancellationNotes: Array.isArray(item.cancellationNotes) ? item.cancellationNotes : [],
    type: item.type || "",
    demandType: item.demandType || undefined,
    ticketType: Array.isArray(item.ticketType) ? item.ticketType.map(mapTicketType) : [],
    keywords: item.keywords || undefined,
  };
}

function mapVisitDate(visitDate: any): VisitDate {
  return {
    request: visitDate.request || undefined,
    required: visitDate.required || undefined,
    isOpenDated: visitDate.isOpenDated || undefined,
  };
}

function mapQuestion(question: any): Question {
  return {
    id: parseInt(String(question.id || 0)),
    options: Array.isArray(question.options) ? question.options : [],
    optional: !!question.optional,
    question: question.question || "",
    questionCode: question.questionCode || undefined,
    isAnswerLater: question.isAnswerLater || undefined,
    type: question.type || undefined,
  };
}

export function mapTicketType(data: any): TicketType {
  const parse = (value: any) => parseFloat(String(value ?? 0));

  return {
    id: parseInt(String(data.id ?? 0)),
    sku: data.sku ?? "",
    name: data.name ?? "",
    originalPrice: parse(data.originalPrice),
    originalMerchantPrice: parse(data.originalMerchantPrice),
    issuanceLimit: data.issuanceLimit ?? undefined,
    minPurchaseQty: data.minPurchaseQty ?? undefined,
    maxPurchaseQty: data.maxPurchaseQty ?? undefined,
    merchantReference: data.merchantReference ?? "",
    ageFrom: data.ageFrom ?? undefined,
    ageTo: data.ageTo ?? undefined,
    applyToAllQna: !!data.applyToAllQna,
    nettPrice: parse(data.nettPrice),
    nettMerchantPrice: parse(data.nettMerchantPrice),
    minimumSellingPrice: parse(data.minimumSellingPrice),
    minimumMerchantSellingPrice: parse(data.minimumMerchantSellingPrice),
    recommendedSellingPrice: parse(data.recommendedSellingPrice),
  };
}