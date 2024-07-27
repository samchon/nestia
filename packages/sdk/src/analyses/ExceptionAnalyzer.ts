import path from "path";
import ts from "typescript";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { ITypeTuple } from "../structures/ITypeTuple";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";

export namespace ExceptionAnalyzer {
  export const analyze =
    (project: INestiaProject) =>
    (props: {
      generics: GenericAnalyzer.Dictionary;
      imports: ImportAnalyzer.Dictionary;
      controller: IReflectController;
      operation: IReflectHttpOperation;
      declaration: ts.MethodDeclaration;
    }): Record<
      number | "2XX" | "3XX" | "4XX" | "5XX",
      ITypedHttpRoute.IOutput
    > => {
      const output: Record<
        number | "2XX" | "3XX" | "4XX" | "5XX",
        ITypedHttpRoute.IOutput
      > = {} as any;
      for (const decorator of props.declaration.modifiers ?? [])
        if (ts.isDecorator(decorator))
          analyzeTyped(project)({
            ...props,
            output,
            decorator,
          });
      return output;
    };

  const analyzeTyped =
    (project: INestiaProject) =>
    (props: {
      generics: GenericAnalyzer.Dictionary;
      imports: ImportAnalyzer.Dictionary;
      controller: IReflectController;
      operation: IReflectHttpOperation;
      output: Record<
        number | "2XX" | "3XX" | "4XX" | "5XX",
        ITypedHttpRoute.IOutput
      >;
      decorator: ts.Decorator;
    }): boolean => {
      // CHECK DECORATOR
      if (!ts.isCallExpression(props.decorator.expression)) return false;
      else if ((props.decorator.expression.typeArguments ?? []).length !== 1)
        return false;

      // CHECK SIGNATURE
      const signature: ts.Signature | undefined =
        project.checker.getResolvedSignature(props.decorator.expression);
      if (!signature || !signature.declaration) return false;
      else if (
        path
          .resolve(signature.declaration.getSourceFile().fileName)
          .indexOf(TYPED_EXCEPTION_PATH) === -1
      )
        return false;

      // GET TYPE INFO
      const status: string | null = getStatus(project.checker)(
        props.decorator.expression.arguments[0] ?? null,
      );
      if (status === null) return false;

      const node: ts.TypeNode = props.decorator.expression.typeArguments![0];
      const type: ts.Type = project.checker.getTypeFromTypeNode(node);
      if (type.isTypeParameter()) {
        project.errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.operation.name,
          message: "TypedException() without generic argument specification.",
        });
        return false;
      }

      const tuple: ITypeTuple | null = ImportAnalyzer.analyze(project.checker)({
        generics: props.generics,
        imports: props.imports,
        type,
      });
      if (tuple === null) {
        project.errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.operation.name,
          message: `TypeException() with unknown type on ${status} status.`,
        });
        return false;
      }

      // DO ASSIGN
      const matched: IReflectHttpOperation.IException[] = Object.entries(
        props.operation.exceptions,
      )
        .filter(([key]) => status === key)
        .map(([_key, value]) => value);
      for (const m of matched)
        props.output[m.status] = {
          type: tuple.type,
          typeName: tuple.typeName,
          contentType: "application/json",
          description: m.description,
        };
      return true;
    };

  const getStatus =
    (checker: ts.TypeChecker) =>
    (expression: ts.Expression | null): string | null => {
      if (expression === null) return null;

      const type: ts.Type = checker.getTypeAtLocation(expression);
      const result = MetadataFactory.analyze(checker)({
        escape: true,
        constant: true,
        absorb: true,
      })(new MetadataCollection())(type);
      if (false === result.success) return null;

      const meta: Metadata = result.data;
      if (meta.constants.length === 1)
        return meta.constants[0].values[0].value.toString();
      else if (meta.escaped && meta.escaped.returns.constants.length === 1)
        return meta.escaped.returns.constants[0].values[0].value.toString();
      else if (ts.isStringLiteral(expression)) return expression.text;
      else if (ts.isNumericLiteral(expression)) {
        const value: number = Number(expression.text.split("_").join(""));
        if (false === isNaN(value)) return value.toString();
      }
      return null;
    };
}

const TYPED_EXCEPTION_PATH = path.join(
  "node_modules",
  "@nestia",
  "core",
  "lib",
  "decorators",
  "TypedException.d.ts",
);
