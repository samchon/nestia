import { ILlmSchema } from "@samchon/openapi";

export interface INestiaTransformOptions {
  validate?: INestiaTransformOptions.Validate;
  stringify?: INestiaTransformOptions.Stringify | null;
  llm?: INestiaTransformOptions.ILlm<"chatgpt" | "gemini" | "3.0">;
  throws?: boolean;
}
export namespace INestiaTransformOptions {
  export type Validate =
    // NORMAL
    | "assert"
    | "is"
    | "validate"
    // STRICT
    | "assertEquals"
    | "equals"
    | "validateEquals"
    // CLONE
    | "assertClone"
    | "validateClone"
    // PRUNE
    | "assertPrune"
    | "validatePrune";

  export type Stringify =
    | "stringify"
    | "assert"
    | "is"
    | "validate"
    | "validate.log";

  export interface ILlm<Model extends ILlmSchema.Model> {
    model: Model;
    strict?: Model extends "chatgpt" ? boolean : never;
    recursive?: Model extends "gemini" | "3.0" ? false | number : never;
  }
}
