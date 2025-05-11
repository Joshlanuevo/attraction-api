import { OtherInfo } from "./GlobalTixCreateTransactionRequest";

export class GlobalTixCreateTransactionResponse {
    data: ResponseData;
    error?: any;
    size?: number;
    success: boolean;
    
    constructor(currency: string, data: any = {}) {
      this.success = data.success || false;
      this.size = data.size || 0;
      this.error = data.error;
      
      // Initialize data object with currency
      if (data.data) {
        this.data = new ResponseData(currency, data.data);
      } else {
        this.data = new ResponseData(currency, {});
      }
    }

    toPlainObject() {
      return {
        success: this.success,
        size: this.size,
        error: this.error,
        data: this.data?.toPlainObject(),
      };
  }
}
  
export class ResponseData {
    time?: string;
    currency: string;
    amount: number;
    reference_number?: string;
    alternateEmail?: string;
    email?: string;
    customerName?: string;
    paymentStatus?: PaymentStatus;
    eTicketUrl?: string;
    otherInfo?: OtherInfo;
    tickets?: Ticket[];
    
    constructor(currency: string, data: any = {}) {
      this.currency = currency;
      
      // Copy properties from data to this object
      Object.assign(this, data);
      
      // Handle amount and ensure it's a number
      this.amount = Number(data.amount || 0);
      
      // Handle nested objects
      if (data.paymentStatus) {
        this.paymentStatus = new PaymentStatus(data.paymentStatus);
      }
      
      if (data.otherInfo) {
        this.otherInfo = new OtherInfo(data.otherInfo);
      }
      
      // Handle tickets array
      if (data.tickets && Array.isArray(data.tickets)) {
        this.tickets = data.tickets.map(
          (item: any) => new Ticket(currency, item)
        );
      }
    }

    toPlainObject() {
      return {
        time: this.time,
        currency: this.currency,
        amount: this.amount,
        reference_number: this.reference_number,
        alternateEmail: this.alternateEmail,
        email: this.email,
        customerName: this.customerName,
        paymentStatus: this.paymentStatus?.toPlainObject?.(),
        eTicketUrl: this.eTicketUrl,
        otherInfo: this.otherInfo?.toPlainObject?.(),
        tickets: this.tickets?.map(ticket => ticket.toPlainObject?.())
      };
    }
}
  
export class PaymentStatus {
    name?: string;
    
    constructor(data: any = {}) {
      Object.assign(this, data);
    }

    toPlainObject() {
      return {
        name: this.name,
      };
    }
}
  
export class Ticket {
    id?: string;
    code?: string;
    name?: string;
    variation?: Variation;
    product?: Product;
    status?: Status;
    ticketFormat?: string;
    redeemed?: boolean;
    termsAndConditions?: string;
    reseller?: string;
    description?: string;
    isOpenDated?: boolean;
    attractionTitle?: string;
    location?: string;
    postalCode?: string;
    attractionImagePath?: string;
    sellingPrice: number;
    paidAmount: number;
    checkoutPrice: number;
    transaction?: Transaction;
    visitDate?: string;
    currency: string;
    
    constructor(currency: string, data: any = {}) {
      this.currency = currency;
      
      // Initialize with default values
      this.sellingPrice = 0;
      this.paidAmount = 0;
      this.checkoutPrice = 0;
      
      // Copy properties from data to this object
      Object.assign(this, data);
      
      // Handle numeric values
      this.sellingPrice = Number(data.sellingPrice || 0);
      this.paidAmount = Number(data.paidAmount || 0);
      this.checkoutPrice = Number(data.checkoutPrice || 0);
      
      // Handle nested objects
      if (data.variation) {
        this.variation = new Variation(data.variation);
      }
      
      if (data.product) {
        this.product = new Product(data.product);
      }
      
      if (data.status) {
        this.status = new Status(data.status);
      }
      
      if (data.transaction) {
        this.transaction = new Transaction(data.transaction);
      }
    }

    toPlainObject() {
      return {
        id: this.id,
        code: this.code,
        name: this.name,
        variation: this.variation?.toPlainObject?.(),
        product: this.product?.toPlainObject?.(),
        status: this.status?.toPlainObject?.(),
        ticketFormat: this.ticketFormat,
        redeemed: this.redeemed,
        termsAndConditions: this.termsAndConditions,
        reseller: this.reseller,
        description: this.description,
        isOpenDated: this.isOpenDated,
        attractionTitle: this.attractionTitle,
        location: this.location,
        postalCode: this.postalCode,
        attractionImagePath: this.attractionImagePath,
        sellingPrice: this.sellingPrice,
        paidAmount: this.paidAmount,
        checkoutPrice: this.checkoutPrice,
        transaction: this.transaction?.toPlainObject?.(),
        visitDate: this.visitDate,
        currency: this.currency
      };
    }
}
  
export class Variation {
    name?: string;
    
    constructor(data: any = {}) {
      Object.assign(this, data);
    }

    toPlainObject() {
      return {
        name: this.name,
      };
    }
}
  
export class Product {
    id?: string;
    sku?: string;
    
    constructor(data: any = {}) {
      Object.assign(this, data);
    }

    toPlainObject() {
      return {
        id: this.id,
        sku: this.sku,
      };
    }
}
  
export class Status {
    name?: string;
    
    constructor(data: any = {}) {
      Object.assign(this, data);
    }

    toPlainObject() {
      return {
        name: this.name,
      };
    }
}
  
export class Transaction {
    id?: string;
    referenceNumber?: string;
    time?: string;
    paymentMethod?: string;
    
    constructor(data: any = {}) {
      Object.assign(this, data);
    }

    toPlainObject() {
      return {
        id: this.id,
        referenceNumber: this.referenceNumber,
        time: this.time,
        paymentMethod: this.paymentMethod,
      };
    }
}