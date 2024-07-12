export namespace SwaggerExample {
  export function Response<T>(value: T): MethodDecorator;
  export function Response<T>(key: string, value: T): MethodDecorator;
  export function Response(...args: any[]): MethodDecorator {
    return function SwaggerExampleResponse(
      _target: Object,
      _propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<any>,
    ): TypedPropertyDescriptor<any> {
      emplaceValue(emplaceOfResponse(descriptor))(args);
      return descriptor;
    };
  }

  export function Parameter<T>(value: T): ParameterDecorator;
  export function Parameter<T>(key: string, value: T): ParameterDecorator;
  export function Parameter(...args: any[]): ParameterDecorator {
    return function SwaggerExampleParameter(
      target: Object,
      propertyKey: string | symbol | undefined,
      index: number,
    ): void {
      emplaceValue(emplaceOfParameter(target, propertyKey ?? "", index))(args);
    };
  }

  export interface IData<T> {
    examples?: Record<string, T>;
    example?: T;
    index?: number;
  }
}

const emplaceValue =
  <T>(data: SwaggerExample.IData<T>) =>
  (args: any[]) => {
    if (args.length === 1) data.example = args[0];
    else {
      const key: string = args[0];
      const value: T = args[1];
      data.examples ??= {};
      data.examples[key] = value;
    }
  };

const emplaceOfResponse = <T>(
  descriptor: TypedPropertyDescriptor<any>,
): SwaggerExample.IData<T> => {
  const oldbie: SwaggerExample.IData<T> | undefined = Reflect.getMetadata(
    "nestia/SwaggerExample/Response",
    descriptor.value,
  );
  if (oldbie !== undefined) return oldbie;
  const newbie: SwaggerExample.IData<T> = {};
  Reflect.defineMetadata(
    "nestia/SwaggerExample/Response",
    newbie,
    descriptor.value,
  );
  return newbie;
};

const emplaceOfParameter = (
  target: Object,
  propertyKey: string | symbol,
  index: number,
): SwaggerExample.IData<any> => {
  const array: SwaggerExample.IData<any>[] = emplaceArrayOfParameters(
    target,
    propertyKey,
  );
  const oldibe: SwaggerExample.IData<any> | undefined = array.find(
    (e) => e.index === index,
  );
  if (oldibe !== undefined) return oldibe;

  const data: SwaggerExample.IData<any> = { index };
  array.push(data);
  return data;
};

const emplaceArrayOfParameters = (
  target: Object,
  propertyKey: string | symbol,
): SwaggerExample.IData<any>[] => {
  const array: SwaggerExample.IData<any>[] | undefined = Reflect.getMetadata(
    "nestia/SwaggerExample/Parameters",
    target,
    propertyKey,
  );
  if (array !== undefined) return array;
  const newbie: SwaggerExample.IData<any>[] = [];
  Reflect.defineMetadata(
    "nestia/SwaggerExample/Parameters",
    newbie,
    target,
    propertyKey,
  );
  return newbie;
};
