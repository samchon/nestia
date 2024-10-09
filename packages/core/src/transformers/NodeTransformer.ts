import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { MethodTransformer } from "./MethodTransformer";
import { ParameterTransformer } from "./ParameterTransformer";

export namespace NodeTransformer {
  export const transform = (props: {
    context: INestiaTransformContext;
    node: ts.Node;
  }): ts.Node =>
    ts.isMethodDeclaration(props.node)
      ? MethodTransformer.transform({
          context: props.context,
          method: props.node,
        })
      : ts.isParameter(props.node)
        ? ParameterTransformer.transform({
            context: props.context,
            param: props.node,
          })
        : props.node;
}
