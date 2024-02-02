import ts from "typescript";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";
import { MetadataCollection } from "typia/lib/factories/MetadataCollection";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { HttpAssertFormDataProgrammer } from "typia/lib/programmers/http/HttpAssertFormDataProgrammer";
import { HttpFormDataProgrammer } from "typia/lib/programmers/http/HttpFormDataProgrammer";
import { HttpIsFormDataProgrammer } from "typia/lib/programmers/http/HttpIsFormDataProgrammer";
import { HttpValidateFormDataProgrammer } from "typia/lib/programmers/http/HttpValidateFormDataProgrammer";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";
import { IProject } from "typia/lib/transformers/IProject";
import { TransformerError } from "typia/lib/transformers/TransformerError";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { IRequestMultipartProps } from "../options/IRequestMulltipartProps";

export namespace TypedMultipartBodyProgrammer {
  export const generate =
    (project: INestiaTransformProject) =>
    (modulo: ts.LeftHandSideExpression) =>
    (type: ts.Type): ts.ObjectLiteralExpression => {
      // VALIDATE TYPE
      const collection: MetadataCollection = new MetadataCollection();
      const result = MetadataFactory.analyze(
        project.checker,
        project.context,
      )({
        escape: false,
        constant: true,
        absorb: true,
        validate: HttpFormDataProgrammer.validate,
      })(collection)(type);
      if (result.success === false)
        throw TransformerError.from("nestia.core.TypedMultipart.Body")(
          result.errors,
        );

      const files: IRequestMultipartProps.IFile[] =
        result.data.objects[0].properties
          .filter(
            (p) =>
              isFile(p.value) ||
              p.value.arrays.some((a) => isFile(a.type.value)),
          )
          .map((p) => ({
            name: p.key.constants[0].values[0] as string,
            limit: !!p.value.natives.length ? 1 : null,
          }));

      // GENERATE VALIDATION PLAN
      const parameter =
        (key: IRequestMultipartProps<any>["validator"]["type"]) =>
        (
          programmer: (
            project: IProject,
          ) => (
            modulo: ts.LeftHandSideExpression,
          ) => (type: ts.Type) => ts.ArrowFunction,
        ) =>
          ts.factory.createObjectLiteralExpression(
            [
              ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier("files"),
                LiteralFactory.generate(files),
              ),
              ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier("validator"),
                ts.factory.createObjectLiteralExpression(
                  [
                    ts.factory.createPropertyAssignment(
                      ts.factory.createIdentifier("type"),
                      ts.factory.createStringLiteral(key),
                    ),
                    ts.factory.createPropertyAssignment(
                      ts.factory.createIdentifier(key),
                      programmer({
                        ...project,
                        options: {
                          numeric: false,
                          finite: false,
                          functional: false,
                        },
                      })(modulo)(type),
                    ),
                  ],
                  true,
                ),
              ),
            ],
            true,
          );

      // RETURNS
      const category = project.options.validate;
      if (category === "is" || category === "equals")
        return parameter("is")(HttpIsFormDataProgrammer.write);
      else if (
        category === "validate" ||
        category === "validateEquals" ||
        category === "validateClone" ||
        category === "validatePrune"
      )
        return parameter("validate")(HttpValidateFormDataProgrammer.write);
      return parameter("assert")(HttpAssertFormDataProgrammer.write);
    };
}

const isFile = (meta: Metadata) =>
  meta.natives.some((n) => n === "File" || n === "Blob");
