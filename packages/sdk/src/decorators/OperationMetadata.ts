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
 *
 * @evidence contracts/common.md#principled-implementation The metadata is defined on the class prototype and property key, from an object or its JSON text, which is the key the reflection analyzers look up.
 * @evidence contracts/common.md#clear-and-simple-design One decorator that parses when given text and defines one metadata entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It only records what the transform computed and does not alter the method.
 * @evidence contracts/common.md#meaningful-documentation The comment states who emits and who reads the metadata.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation OperationMetadata attaches metadata through Reflect.defineMetadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
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
