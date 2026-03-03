import type { IUser } from "./IUser";

export namespace IAuth {
  export type IAccount = {
    user: IUser.IProfile;
    account_id: string;
  };
}
