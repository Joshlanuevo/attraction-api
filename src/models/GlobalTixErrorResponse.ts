import { BaseModel } from "./BaseModel";

export class Error extends BaseModel {
    code!: string;
    errorDetails: any;
    message!: string;
}
  
export class GlobalTixErrorResponse extends BaseModel {
    data: any;
    error!: Error;
    size: any;
    success!: boolean;
  
    protected transformers(key: string, value: any): any {
      if (key === 'error' && value && typeof value === 'object') {
        return new Error(value);
      }
      return value;
    }
}