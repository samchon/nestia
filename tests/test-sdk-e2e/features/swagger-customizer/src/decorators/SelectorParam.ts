import { SwaggerCustomizer } from "@nestia/core";

export function SelectorParam(neighbor: () => Function): ParameterDecorator {
  return function (
    target: Object,
    key: string | symbol | undefined,
    index: number,
  ): void {
    SwaggerCustomizer((props) => {
      // FIND MATCHED PARAMETER
      const routeArguments:
        | undefined
        | Record<
            string,
            {
              index: number;
              data: string;
            }
          > = Reflect.getMetadata(
        "__routeArguments__",
        target.constructor,
        key!,
      );
      if (routeArguments === undefined) return;

      const record = Object.values(routeArguments).find(
        (row: any) => row.index === index,
      );
      if (record === undefined) return;

      const param = props.route.parameters?.find((p) => p.name === record.data);
      if (param?.in !== "path") return;

      // DO CUSTOMIZE
      const found = props.at(neighbor());
      if (found)
        (props.route as any)["x-selector"] = {
          method: found.method,
          path: found.path,
        };
    })(target, key!, index as any);
  };
}
