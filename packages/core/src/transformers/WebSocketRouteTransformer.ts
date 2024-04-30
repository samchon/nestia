import path from "path";
import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace WebSocketRouteTransformer {
  export const validate =
    (project: INestiaTransformProject) =>
    (decorator: ts.Decorator, method: ts.MethodDeclaration): ts.Decorator => {
      if (!ts.isCallExpression(decorator.expression)) return decorator;

      // CHECK SIGNATURE
      const signature: ts.Signature | undefined =
        project.checker.getResolvedSignature(decorator.expression);
      if (!signature || !signature.declaration) return decorator;
      else if (isLocated(signature) === false) return decorator;

      const errors: ts.DiagnosticWithLocation[] = [];
      let accepted: boolean = false;

      const report = (node: ts.Node, message: string) => {
        errors.push(
          ts.createDiagnosticForNode(node, {
            category: ts.DiagnosticCategory.Error,
            key: "nestia.core.WebSocketRoute",
            code: "(nestia.core.WebSocketRoute)" as any,
            message,
          }),
        );
      };
      method.parameters.forEach((param) => {
        const paramDecos: ts.Decorator[] = (param.modifiers ?? []).filter((m) =>
          ts.isDecorator(m),
        ) as ts.Decorator[];
        const category: string | null = (() => {
          if (paramDecos.length !== 1) return null;
          const decorator: ts.Decorator = paramDecos[0];
          const signature: ts.Signature | undefined = ts.isCallExpression(
            decorator.expression,
          )
            ? project.checker.getResolvedSignature(decorator.expression)
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
              .split(".")
              .at(-1)
              ?.startsWith("WebAcceptor") !== true
          )
            report(
              param,
              `parameter ${JSON.stringify(param.name.getText())} must have WebAcceptor<Header, Provider, Listener> type.`,
            );
        } else if (category === "Driver") {
          if (
            param.type?.getText().split(".").at(-1)?.startsWith("Driver") !==
            true
          )
            report(
              param,
              `parameter ${JSON.stringify(param.name.getText())} must have Driver<Listener> type.`,
            );
        }
      });
      if (accepted === false)
        report(
          method,
          `method ${JSON.stringify(method.name.getText())} must have at least one parameter decorated by @WebSocketRoute.Acceptor().`,
        );
      for (const e of errors) project.extras.addDiagnostic(e);
      return decorator;
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
