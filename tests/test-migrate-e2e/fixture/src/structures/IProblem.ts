export interface IProblem {
  code: IProblem.Code;
  message: string;
  details?: Record<string, string[]>;
}

export namespace IProblem {
  export type Code = "INVALID_INPUT" | "NOT_FOUND" | "CONFLICT";
}
