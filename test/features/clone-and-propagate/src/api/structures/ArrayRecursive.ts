export namespace ArrayRecursive {
  export type ICategory = {
    children: ArrayRecursive.ICategory[];
    id: number;
    code: string;
    sequence: number;
    created_at: ArrayRecursive.ITimestamp;
  };
  export type ITimestamp = {
    time: number;
    zone: number;
  };
}
