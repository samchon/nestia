import typia from "typia";

export interface IRuntimeGlobal {
  blob: Blob;
}

export const check = typia.createIs<IRuntimeGlobal>();
