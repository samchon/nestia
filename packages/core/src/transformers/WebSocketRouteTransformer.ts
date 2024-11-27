import path from "path";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";

export namespace WebSocketRouteTransformer {
  export const validate = (props: {
    context: INestiaTransformContext;
    decorator: ts.Decorator;
    method: ts.MethodDeclaration;
  }): ts.Decorator => {
    if (!ts.isCallExpression(props.decorator.expression))
      return props.decorator;

    // CHECK SIGNATURE
    const signature: ts.Signature | undefined =
      props.context.checker.getResolvedSignature(props.decorator.expression);
    if (!signature || !signature.declaration) return props.decorator;
    else if (isLocated(signature) === false) return props.decorator;

    const errors: ts.DiagnosticWithLocation[] = [];
    let accepted: boolean = false;

    const report = (node: ts.Node, message: string) => {
      errors.push(
        (ts as any).createDiagnosticForNode(node, {
          category: ts.DiagnosticCategory.Error,
          key: "nestia.core.WebSocketRoute",
          code: "(nestia.core.WebSocketRoute)" as any,
          message,
        }),
      );
    };
    props.method.parameters.forEach((param) => {
      const paramDecos: ts.Decorator[] = (param.modifiers ?? []).filter((m) =>
        ts.isDecorator(m),
      ) as ts.Decorator[];
      const category: string | null = (() => {
        if (paramDecos.length !== 1) return null;
        const decorator: ts.Decorator = paramDecos[0];
        const signature: ts.Signature | undefined = ts.isCallExpression(
          decorator.expression,
        )
          ? props.context.checker.getResolvedSignature(decorator.expression)
          : undefined;
        if (signature === undefined || isLocated(signature) === false)
          return null;
        return (
          decorator.expression.getText().split(".").at(-1)?.split("(")[0] ??
          null
        );
      })();
      if (category === null)
        report(
          param,
          `parameter ${JSON.stringify(param.name.getText())} is not decorated with nested function of WebSocketRoute module.`,
        );
      else if (category === "Acceptor") {
        accepted = true;
        if (
          param.type
            ?.getText()
            .split("<")[0]
            ?.split(".")
            .at(-1)
            ?.startsWith("WebSocketAcceptor") !== true
        )
          report(
            param,
            `parameter ${JSON.stringify(param.name.getText())} must have WebSocketAcceptor<Header, Provider, Listener> type.`,
          );
      } else if (category === "Driver") {
        if (
          param.type
            ?.getText()
            .split("<")[0]
            ?.split(".")
            .at(-1)
            ?.startsWith("Driver") !== true
        )
          report(
            param,
            `parameter ${JSON.stringify(param.name.getText())} must have Driver<Listener> type.`,
          );
      }
    });
    if (accepted === false)
      report(
        props.method,
        `method ${JSON.stringify(props.method.name.getText())} must have at least one parameter decorated by @WebSocketRoute.Acceptor().`,
      );
    for (const e of errors) props.context.extras.addDiagnostic(e);
    return props.decorator;
  };
}

const isLocated = (signature: ts.Signature) => {
  if (!signature.declaration) return false;
  const location: string = path.resolve(
    signature.declaration.getSourceFile().fileName,
  );
  return location.indexOf(LIB_PATH) !== -1;
};

const LIB_PATH = path.join(
  "@nestia",
  "core",
  "lib",
  "decorators",
  `WebSocketRoute.d.ts`,
);
