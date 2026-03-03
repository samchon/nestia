import { HttpParameterProgrammer } from "@typia/core";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";

export namespace TypedParamProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    arguments: readonly ts.Expression[];
    type: ts.Type;
  }): readonly ts.Expression[] => {
    // ALREADY BEING TRANSFORMED
    if (props.arguments.length !== 1) return props.arguments;
    return [
      props.arguments[0]!,
      HttpParameterProgrammer.write({
        context: {
          ...props.context,
          options: {
            numeric: true,
          },
        },
        modulo: props.modulo,
        type: props.type,
        name: undefined,
      }),
      ...(props.context.options?.validate?.startsWith("validate")
        ? [ts.factory.createTrue()]
        : []),
    ];
  };
}
