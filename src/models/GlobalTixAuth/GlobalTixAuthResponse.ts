import { BaseModel } from "../BaseModel";
import { ISOCurrencyEnums } from "../Currency/ISOCurrencyEnums";

export class Currency extends BaseModel {
    code!: ISOCurrencyEnums;
    description!: string;
    markup!: number;
    roundingUp!: number;
    creditCardFee!: number;
  
    protected transformers(key: string, value: any): any {
      if (key === 'code' && value) {
        return value as ISOCurrencyEnums;
      }
      return value;
    }
}
  
export class Reseller extends BaseModel {
    class!: string;
    id!: number;
    accountManager: any;
    attachmentLogoUrl: any;
    code!: string;
    commissionBasedAgent: any;
    country: any;
    createBy: any;
    createdBy: any;
    credit: any;
    creditCardFee!: number;
    creditCardPaymentOnly!: boolean;
    customEmailAPI: any;
    customEmailFilename: any;
    customEmailType: any;
    dateCreated!: string;
    emailConfig: any;
    emailLogoUrl!: string;
    externalReseller: any;
    globalMarkup: any;
    hasBeenNotifiedLowCreditLimit!: boolean;
    headquarters: any;
    internalEmail!: string;
    isAttachmentLogo: any;
    isEmailLogo!: boolean;
    isMerchantBarcodeOnly!: boolean;
    isSubAgentOnly!: boolean;
    lastUpdated!: string;
    lastUpdatedBy!: string;
    lowCreditLimit!: number;
    mainReseller!: boolean;
    merchantGroups!: any[];
    mobileNumber!: string;
    monthlyFee: any;
    name!: string;
    noAttachmentPurchase!: boolean;
    noCustomerEmail!: boolean;
    notifyLowCredit!: boolean;
    notifyLowCreditEmail!: string;
    onlineStore: any;
    ownMerchant: any;
    paymentProcessingFee: any;
    pos: any;
    presetGroups: any;
    primaryPresetGroup: any;
    salesCommission: any;
    sendCustomEmail!: boolean;
    size: any;
    status: any;
    subAgentGroups: any;
    transactionExpire!: number;
    transactionFee!: number;
    transactionFeeCap: any;
    transactionFeeType: any;
    useCallback: any;
    useCase: any;
    webhook: any;
}
  
export class User extends BaseModel {
    id!: number;
    firstname: any;
    lastname: any;
    username!: string;
    merchant: any;
    supplierApi: any;
    reseller!: Reseller;
    backoffice: any;
    currency!: Currency;
    isProxyUser!: boolean;
    isUsing2FA!: boolean;
    enable2fa!: boolean;
  
    protected transformers(key: string, value: any): any {
      if (key === 'reseller' && value) {
        return new Reseller(value);
      } else if (key === 'currency' && value) {
        return new Currency(value);
      }
      return value;
    }
}
  
export class Data extends BaseModel {
    roles!: string[];
    token_type!: string;
    access_token!: string;
    user!: User;
    expires_in!: number;
    refresh_token!: string;
  
    protected transformers(key: string, value: any): any {
      if (key === 'user' && value) {
        return new User(value);
      }
      return value;
    }
}
  
export class GlobalTixAuthResponse extends BaseModel {
    success!: boolean;
    data!: Data;
    error: any;
  
    protected transformers(key: string, value: any): any {
      if (key === 'data' && value) {
        return new Data(value);
      }
      return value;
    }
}