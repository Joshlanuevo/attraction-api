import { BaseModel } from "../BaseModel";
import { getGlobalTixCredentials } from "../../config/attractionApiConfig";

export class GlobalTixAuthRequest extends BaseModel {
  username: string;
  remember: boolean = true;
  password: string;
  language: string = "";

  constructor(data: Partial<GlobalTixAuthRequest> = {}) {
    super();
    const credentials = getGlobalTixCredentials();
    this.username = credentials.username || '';
    this.password = credentials.password || '';
    Object.assign(this, data);
  }
}