import { SwaggerCustomizer } from "@nestia/core";

/**
 * Adds a selected neighbor's composed route identity to a path parameter route.
 *
 * 1. Match the actual Nest route-argument index to its path parameter name.
 * 2. Resolve the supplied neighbor through the public Swagger customizer API.
 *
 * @evidence contracts/common.md#principled-implementation Nest route-argument metadata maps the decorated index to the actual path parameter; public props.at maps the authored neighbor function to its composed method/path. Missing metadata, indexes or non-path parameters leave the route unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One parameter decorator registers one public Swagger customizer. The callback reads its own method metadata and route parameters before selecting the neighbor; it owns no generator or resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Public SwaggerCustomizer registration and props.at are the supported extension boundary. The original callback is retained without replacing reflection or generator operations.
 * @evidence contracts/common.md#meaningful-documentation The comment explains the parameter-index and neighbor lookup steps and unchanged-route boundaries.
 */
export function RichSelectorParam(
  neighbor: () => Function,
): ParameterDecorator {
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
