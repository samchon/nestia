export namespace CloneDuplicateException {
  interface IBody<T extends string> {
    code: T;
    message: string;
  }

  export type Unauthorized = IBody<"UNAUTHORIZED">;
}
