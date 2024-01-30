import type { IBucket } from "./IBucket";

export type IShortcut = {
  id: number;
  name: string;
  path: string;
  target: IBucket;
  type: "file";
  extension: "lnk";
};
export namespace IShortcut {
  export type o1 = {
    id: number;
    name: string;
    path: string;
    target: IBucket.o1;
  };
}
