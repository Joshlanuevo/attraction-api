import { BaseModelWithDB } from "./BaseModelWithDB";
import { PlatformFeatures } from "./PlatformFeatures";
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { AttachmentDocuments } from './Includes/AttachmentDocuments';
import { ISOCurrencyEnums } from './Currency/ISOCurrencyEnums';
import { isFullArray } from '../utils/helpers';

export class AgencyModel extends BaseModelWithDB {
    id!: string;
    is_whitelabel: boolean = false;
    company_name!: string;
    city_name!: string;
    region_name!: string;
    country!: string;
    sales_person_name!: string;
    registered_date!: string;
    activated_date?: string;
    remaining_amount!: number;
    email!: string;
    contact_no!: string;
    mobile_no!: string;
    address_1!: string;
    address_2!: string;
    pin_code!: string;
    tin_number!: string;
    registration_no!: string;
    brand_logo!: string;
    package_avail!: string;
    masteragent_id!: string;
    features!: PlatformFeatures;
    attachments!: AttachmentDocuments[];
    currency: ISOCurrencyEnums = ISOCurrencyEnums.PHP;
  
    constructor(data: Partial<AgencyModel> = {}) {
      super(data);
      this.currency = this.currency || ISOCurrencyEnums.PHP;
      this.collection = FirebaseCollections.agencies;
    }
  
    protected transformers(key: string, value: any): any {
      if (key === 'attachments') {
        if (!isFullArray(value)) return [];
        return value.map((attachment: any) => new AttachmentDocuments(attachment));
      } else if (key === 'currency') {
        if (!value) return this.currency;
        return value as ISOCurrencyEnums;
      } else if (key === 'features') {
        if (!isFullArray(value)) {
          value = {};
        }
        return new PlatformFeatures(value);
      }
      return value;
    }
  
    getDocId(): string {
      return this.id;
    }
  
    getRequiredFields(): string[] {
      return [
        "id",
        "companyName",
        "cityName",
        "regionName",
        "country",
        "salesPersonName",
        "registeredDate",
        "email",
        "contactNo",
        "mobileNo",
        "address1",
        "pinCode",
        "tinNumber",
        "features",
      ];
    }
}  