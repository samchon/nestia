import path from "path";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { TypedQueryRouteProgrammer } from "../programmers/TypedQueryRouteProgrammer";
import { TypedRouteProgrammer } from "../programmers/TypedRouteProgrammer";

export namespace TypedRouteTransformer {
  export const transform = (props: {
    context: INestiaTransformContext;
    decorator: ts.Decorator;
    type: ts.Type;
  }): ts.Decorator => {
    if (!ts.isCallExpression(props.decorator.expression))
      return props.decorator;

    // CHECK SIGNATURE
    const signature: ts.Signature | undefined =
      props.context.checker.getResolvedSignature(props.decorator.expression);
    if (!signature || !signature.declaration) return props.decorator;

    // CHECK TO BE TRANSFORMED
    const modulo = (() => {
      // CHECK FILENAME
      const location: string = path.resolve(
        signature.declaration.getSourceFile().fileName,
      );
      if (LIB_PATHS.every((str) => location.indexOf(str) === -1)) return null;

      // CHECK DUPLICATE BOOSTER
      if (props.decorator.expression.arguments.length >= 2) return false;
      else if (props.decorator.expression.arguments.length === 1) {
        const last: ts.Expression =
          props.decorator.expression.arguments[
            props.decorator.expression.arguments.length - 1
          ];
        const type: ts.Type = props.context.checker.getTypeAtLocation(last);
        if (isObject(props.context.checker)(type)) return false;
      }
      return location.split(path.sep).at(-1)?.split(".")[0] === "TypedQuery"
        ? "TypedQuery"
        : "TypedRoute";
    })();
    if (modulo === null) return props.decorator;

    // CHECK TYPE NODE
    const typeNode: ts.TypeNode | undefined =
      props.context.checker.typeToTypeNode(props.type, undefined, undefined);
    if (typeNode === undefined) return props.decorator;

    // DO TRANSFORM
    return ts.factory.createDecorator(
      ts.factory.updateCallExpression(
        props.decorator.expression,
        props.decorator.expression.expression,
        props.decorator.expression.typeArguments,
        [
          ...props.decorator.expression.arguments,
          (modulo === "TypedQuery"
            ? TypedQueryRouteProgrammer
            : TypedRouteProgrammer
          ).generate({
            context: props.context,
            type: props.type,
            modulo: props.decorator.expression.expression,
          }),
        ],
      ),
    );
  };

  const isObject =
    (checker: ts.TypeChecker) =>
    (type: ts.Type): boolean =>
      (type.getFlags() & ts.TypeFlags.Object) !== 0 &&
      !(checker as any).isTupleType(type) &&
      !(checker as any).isArrayType(type) &&
      !(checker as any).isArrayLikeType(type);

  const CLASSES: string[] = ["EncryptedRoute", "TypedRoute", "TypedQuery"];
  const LIB_PATHS: string[] = CLASSES.map((cla) => [
    path.join("@nestia", "core", "lib", "decorators", `${cla}.d.ts`),
    path.join("packages", "core", "lib", "decorators", `${cla}.d.ts`),
  ]).flat();
}
