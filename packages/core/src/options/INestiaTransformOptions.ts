import { ITransformOptions } from "typia/lib/transformers/ITransformOptions";

export interface INestiaTransformOptions extends ITransformOptions {
    validate?: "assert" | "is" | "validate";
    stringify?: "stringify" | "assert" | "is" | "validate";
}