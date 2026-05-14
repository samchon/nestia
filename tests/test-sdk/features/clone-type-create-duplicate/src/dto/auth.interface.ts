import { IUser } from "./user.interface";

export namespace IAuth {
  export interface IAccount {
    user: IUser.IProfile;
    account_id: string;
  }
}
