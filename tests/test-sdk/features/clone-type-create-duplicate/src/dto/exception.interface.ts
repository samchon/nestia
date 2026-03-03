export namespace Exception {
  interface IBody<T extends string> {
    code: T;
    message: string;
  }

  export type Unauthorized = IBody<"UNAUTHORIZED">;
}
