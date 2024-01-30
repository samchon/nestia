import type { IBucket } from "./IBucket";

export type IDirectory = {
  id: number;
  name: string;
  path: string;
  children: IBucket[];
  type: "directory";
};
export namespace IDirectory {
  export type o1 = {
    id: number;
    name: string;
    path: string;
    children: IBucket.o1[];
  };
}
