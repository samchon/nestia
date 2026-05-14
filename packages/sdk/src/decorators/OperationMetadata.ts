import { IOperationMetadata } from "../structures/IOperationMetadata";

export function OperationMetadata(
  metadata: IOperationMetadata,
): MethodDecorator {
  return function OperationMetadata(target, propertyKey, descriptor) {
    Reflect.defineMetadata(
      "nestia/OperationMetadata",
      metadata,
      target,
      propertyKey,
    );
    return descriptor;
  };
}
