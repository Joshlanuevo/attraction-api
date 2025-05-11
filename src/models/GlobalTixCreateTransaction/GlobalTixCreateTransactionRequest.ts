export class GlobalTixCreateTransactionRequest {
    newModel?: boolean;
    alternateEmail?: string;
    creditCardCurrencyId?: number;
    customerName?: string;
    email?: string;
    groupName?: string;
    groupBooking?: boolean;
    groupNoOfMember?: number;
    isGrabPayPurchase?: boolean;
    isInstantRedeemAll?: boolean;
    isSingleCodeForGroup?: boolean;
    mobileNumber?: number;
    mobilePrefix?: string;
    otherInfo?: OtherInfo;
    passportNumber?: string;
    paymentMethod?: string;
    remarks?: string;
    ticketTypes: TicketType[];
    promoCodeId?: number;
    promotionType?: string;
    currency: string;
  
    constructor(currency: string, data: any = {}) {
      this.currency = currency;
      this.ticketTypes = [];
      
      // Copy properties from data to this object
      Object.assign(this, data);
      
      // Handle nested objects
      if (data.otherInfo) {
        this.otherInfo = new OtherInfo(data.otherInfo);
      }
      
      // Handle ticket types array
      if (data.ticketTypes && Array.isArray(data.ticketTypes)) {
        this.ticketTypes = data.ticketTypes.map(
          (item: any) => new TicketType(currency, item)
        );
      }
    }
    
    validate(): void {
      // Basic validation
      if (!this.customerName || !this.email) {
        throw new Error('Customer name and email are required');
      }
      
      if (!this.ticketTypes || this.ticketTypes.length === 0) {
        throw new Error('At least one ticket type is required');
      }
      
      // Validate each ticket type
      for (const ticketType of this.ticketTypes) {
        if (!ticketType.id || !ticketType.quantity || ticketType.quantity <= 0) {
          throw new Error('Each ticket type must have an ID and a quantity greater than 0');
        }
      }
    }

    // Add toPlainObject method to convert to a plain JavaScript object
    toPlainObject() {
      return {
        newModel: this.newModel,
        alternateEmail: this.alternateEmail,
        creditCardCurrencyId: this.creditCardCurrencyId,
        customerName: this.customerName,
        email: this.email,
        groupName: this.groupName,
        groupBooking: this.groupBooking,
        groupNoOfMember: this.groupNoOfMember,
        isGrabPayPurchase: this.isGrabPayPurchase,
        isInstantRedeemAll: this.isInstantRedeemAll,
        isSingleCodeForGroup: this.isSingleCodeForGroup,
        mobileNumber: this.mobileNumber,
        mobilePrefix: this.mobilePrefix,
        otherInfo: this.otherInfo?.toPlainObject?.(),
        passportNumber: this.passportNumber,
        paymentMethod: this.paymentMethod,
        remarks: this.remarks,
        ticketTypes: this.ticketTypes.map(ticketType => this.ticketTypeToPlainObject(ticketType)),
        promoCodeId: this.promoCodeId,
        promotionType: this.promotionType,
        currency: this.currency
      };
    }

    // Helper method to convert TicketType objects to plain objects
    private ticketTypeToPlainObject(ticketType: TicketType) {
      const result: any = {
        fromResellerId: ticketType.fromResellerId,
        id: ticketType.id,
        quantity: ticketType.quantity,
        sellingPrice: ticketType.sellingPrice,
        visitDate: ticketType.visitDate,
        index: ticketType.index,
        event_id: ticketType.event_id,
        packageItems: ticketType.packageItems,
        visitDateSettings: ticketType.visitDateSettings
      };

      if (ticketType.questionList && Array.isArray(ticketType.questionList)) {
        result.questionList = ticketType.questionList.map(item => ({
          id: item.id,
          answer: item.answer,
          ticketIndex: item.ticketIndex
        }));
      }

      return result;
    }
}
  
export class OtherInfo {
  partnerReference?: string;
  
  constructor(data: any = {}) {
    Object.assign(this, data);
  }

  toPlainObject() {
    return {
      partnerReference: this.partnerReference,
    };
  }
}
  
export class TicketType {
    fromResellerId?: number;
    id: number;
    quantity: number;
    sellingPrice: number;
    visitDate?: string;
    index?: number;
    questionList?: QuestionListItem[];
    event_id?: number;
    packageItems?: any[];
    visitDateSettings?: any;
    
    constructor(currency: string, data: any = {}) {
      Object.assign(this, data);
      
      // Ensure numeric values
      this.id = Number(data.id || 0);
      this.quantity = Number(data.quantity || 0);
      this.sellingPrice = Number(data.sellingPrice || 0);
      
      // Handle questionList if present
      if (data.questionList && Array.isArray(data.questionList)) {
        this.questionList = data.questionList.map(
          (item: any) => new QuestionListItem(item)
        );
      }
    }
}
  
export class QuestionListItem {
    id!: number;
    answer!: string;
    ticketIndex?: number;
    
    constructor(data: any = {}) {
      Object.assign(this, data);
    }
}
  