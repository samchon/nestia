import typia from "typia";

export interface IUserGlobal {
  blob: Blob;
}

export const check = typia.createIs<IUserGlobal>();
