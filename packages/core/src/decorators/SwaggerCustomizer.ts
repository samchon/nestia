import { ISwagger } from "../structures/ISwagger";
import { ISwaggerRoute } from "../structures/ISwaggerRoute";

export function SwaggerCustomizer(
  closure: (props: SwaggerCustomizer.IProps) => unknown,
): MethodDecorator {
  return function SwaggerCustomizer(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    Reflect.defineMetadata(
      "nestia/SwaggerCustomizer",
      closure,
      target,
      propertyKey,
    );
    return descriptor;
  };
}
export namespace SwaggerCustomizer {
  export interface IProps {
    swagger: ISwagger;
    method: string;
    path: string;
    route: ISwaggerRoute;
    get(accessor: IAccessor): ISwaggerRoute | undefined;
  }
  export interface IAccessor {
    path: string;
    method: string;
  }
}
