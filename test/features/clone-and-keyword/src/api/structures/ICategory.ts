import type { ITimestamp } from "./ITimestamp";

export type ICategory = {
  children: ICategory[];
  id: number;
  code: string;
  sequence: number;
  created_at: ITimestamp;
};
