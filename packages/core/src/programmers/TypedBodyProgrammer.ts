import {
  AssertProgrammer,
  ITypiaContext,
  IsProgrammer,
  JsonMetadataFactory,
  LlmSchemaProgrammer,
  MiscAssertCloneProgrammer,
  MiscAssertPruneProgrammer,
  MiscValidateCloneProgrammer,
  MiscValidatePruneProgrammer,
  ValidateProgrammer,
} from "@typia/core";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { IRequestBodyValidator } from "../options/IRequestBodyValidator";

export namespace TypedBodyProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.ObjectLiteralExpression => {
    // VALIDATE TYPE
    JsonMetadataFactory.analyze({
      method: "@nestia.core.TypedBody",
      checker: props.context.checker,
      transformer: props.context.transformer,
      type: props.type,
      validate: props.context.options.llm
        ? (metadata) =>
            LlmSchemaProgrammer.validate({
              config: {
                strict: props.context.options.llm?.strict ?? false,
              },
              metadata,
            })
        : undefined,
    });

    // GENERATE VALIDATION PLAN
    const check =
      (key: IRequestBodyValidator<any>["type"]) =>
      (equals: boolean) =>
      (
        programmer: (next: {
          context: ITypiaContext;
          modulo: ts.LeftHandSideExpression;
          config: {
            equals: boolean;
            guard: boolean;
          };
          type: ts.Type;
          name: string | undefined;
        }) => ts.Expression,
      ) =>
        ts.factory.createObjectLiteralExpression([
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("type"),
            ts.factory.createStringLiteral(key),
          ),
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(key),
            programmer({
              context: {
                ...props.context,
                options: {
                  numeric: false,
                  finite: false,
                  functional: false,
                },
              },
              modulo: props.modulo,
              config: {
                equals,
                guard: false,
              },
              type: props.type,
              name: undefined,
            }),
          ),
        ]);
    const misc =
      (key: IRequestBodyValidator<any>["type"]) =>
      (
        programmer: (next: {
          context: ITypiaContext;
          modulo: ts.LeftHandSideExpression;
          type: ts.Type;
          name: string | undefined;
        }) => ts.Expression,
      ) =>
        ts.factory.createObjectLiteralExpression([
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("type"),
            ts.factory.createStringLiteral(key),
          ),
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(key),
            programmer({
              context: {
                ...props.context,
                options: {
                  numeric: false,
                  finite: false,
                  functional: false,
                },
              },
              modulo: props.modulo,
              type: props.type,
              name: undefined,
            }),
          ),
        ]);

    //----
    // RETURNS
    //----
    const category = props.context.options.validate;
    // NORMAL
    if (category === "assert")
      return check("assert")(false)(AssertProgrammer.write);
    else if (category === "is") return check("is")(false)(IsProgrammer.write);
    // STRICT
    else if (category === "validateEquals")
      return check("validate")(true)(ValidateProgrammer.write);
    else if (category === "equals")
      return check("is")(true)(IsProgrammer.write);
    else if (category === "assertEquals")
      return check("assert")(true)(AssertProgrammer.write);
    // CLONE
    else if (category === "assertClone")
      return misc("assert")(MiscAssertCloneProgrammer.write);
    else if (category === "validateClone")
      return misc("validate")(MiscValidateCloneProgrammer.write);
    // PRUNE
    else if (category === "assertPrune")
      return misc("assert")(MiscAssertPruneProgrammer.write);
    else if (category === "validatePrune")
      return misc("validate")(MiscValidatePruneProgrammer.write);
    // DEFAULT
    return check("validate")(false)(ValidateProgrammer.write);
  };
}
