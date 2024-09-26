import ts from "typescript";
import { ValidateProgrammer } from "typia/lib/programmers/ValidateProgrammer";
import { JsonAssertStringifyProgrammer } from "typia/lib/programmers/json/JsonAssertStringifyProgrammer";
import { JsonIsStringifyProgrammer } from "typia/lib/programmers/json/JsonIsStringifyProgrammer";
import { JsonStringifyProgrammer } from "typia/lib/programmers/json/JsonStringifyProgrammer";
import { JsonValidateStringifyProgrammer } from "typia/lib/programmers/json/JsonValidateStringifyProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";

export namespace TypedRouteProgrammer {
  export const generate =
    (project: INestiaTransformProject) =>
    (modulo: ts.LeftHandSideExpression) =>
    (type: ts.Type): ts.Expression => {
      // GENERATE STRINGIFY PLAN
      const parameter = (props: {
        type: string;
        key: string;
        programmer: (
          project: IProject,
        ) => (
          modulo: ts.LeftHandSideExpression,
        ) => (type: ts.Type) => ts.Expression;
      }) =>
        ts.factory.createObjectLiteralExpression([
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier("type"),
            ts.factory.createStringLiteral(props.type),
          ),
          ts.factory.createPropertyAssignment(
            ts.factory.createIdentifier(props.key),
            props.programmer({
              ...project,
              options: {}, // use default option
            })(modulo)(type),
          ),
        ]);

      // RETURNS
      if (project.options.stringify === "is")
        return parameter({
          type: "is",
          key: "is",
          programmer: JsonIsStringifyProgrammer.write,
        });
      else if (project.options.stringify === "validate")
        return parameter({
          type: "validate",
          key: "validate",
          programmer: JsonValidateStringifyProgrammer.write,
        });
      else if (project.options.stringify === "stringify")
        return parameter({
          type: "stringify",
          key: "stringify",
          programmer: JsonStringifyProgrammer.write,
        });
      else if (project.options.stringify === "validate.log")
        return parameter({
          type: "validate.log",
          key: "validate",
          programmer: (project) => (modulo) =>
            ValidateProgrammer.write(project)(modulo)(false),
        });
      else if (project.options.stringify === "validateEquals.log")
        return parameter({
          type: "validateEquals.log",
          key: "validate",
          programmer: (project) => (modulo) =>
            ValidateProgrammer.write(project)(modulo)(true),
        });
      else if (project.options.stringify === null)
        return ts.factory.createNull();

      // ASSERT IS DEFAULT
      return parameter({
        type: "assert",
        key: "assert",
        programmer: JsonAssertStringifyProgrammer.write,
      });
    };
}
