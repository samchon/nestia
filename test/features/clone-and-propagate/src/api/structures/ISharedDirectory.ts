import type { IBucket } from "./IBucket";

export type ISharedDirectory = {
  access: "read" | "write";
  id: number;
  name: string;
  path: string;
  children: IBucket.o1[];
};
