import { IOperationMetadata } from "../structures/IOperationMetadata";

/**
 * Carries the compile-time operation metadata the SDK / Swagger / e2e
 * generators read through `Reflect.getMetadata("nestia/OperationMetadata")`.
 *
 * The `@nestia/sdk` native transform injects this decorator as a synthesized
 * AST node, so its argument is a single JSON string literal rather than an
 * object literal — keeping the constructed node tree minimal. The string is
 * parsed once here at module-evaluation time. A pre-parsed `IOperationMetadata`
 * object is still accepted for hand-written or test usage.
 */
export function OperationMetadata(
  metadata: IOperationMetadata | string,
): MethodDecorator {
  const parsed: IOperationMetadata =
    typeof metadata === "string"
      ? (JSON.parse(metadata) as IOperationMetadata)
      : metadata;
  return function OperationMetadata(target, propertyKey, descriptor) {
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      parsed,
      target,
      propertyKey,
    );
    return descriptor;
  };
}
