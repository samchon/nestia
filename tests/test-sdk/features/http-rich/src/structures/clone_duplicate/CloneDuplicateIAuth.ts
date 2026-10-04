import { CloneDuplicateIUser } from "./CloneDuplicateIUser";

export namespace CloneDuplicateIAuth {
  export interface IAccount {
    user: CloneDuplicateIUser.IProfile;
    account_id: string;
  }
}
