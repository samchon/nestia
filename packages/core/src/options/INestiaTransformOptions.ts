export interface INestiaTransformOptions {
    validate?: // NORMAL
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
    stringify?: "stringify" | "assert" | "is" | "validate" | null;
}
