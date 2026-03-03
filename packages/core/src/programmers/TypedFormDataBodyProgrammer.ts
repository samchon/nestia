import {
  HttpAssertFormDataProgrammer,
  HttpFormDataProgrammer,
  HttpIsFormDataProgrammer,
  HttpValidateFormDataProgrammer,
  ITypiaContext,
  LiteralFactory,
  MetadataCollection,
  MetadataFactory,
  MetadataSchema,
  TransformerError,
} from "@typia/core";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { IRequestFormDataProps } from "../options/IRequestFormDataProps";

export namespace TypedFormDataBodyProgrammer {
  export const generate = (props: {
    context: INestiaTransformContext;
    modulo: ts.LeftHandSideExpression;
    type: ts.Type;
  }): ts.ObjectLiteralExpression => {
    // VALIDATE TYPE
    const storage: MetadataCollection = new MetadataCollection();
    const result = MetadataFactory.analyze({
      checker: props.context.checker,
      transformer: props.context.transformer,
      options: {
        escape: false,
        constant: true,
        absorb: true,
        validate: HttpFormDataProgrammer.validate,
      },
      type: props.type,
      components: storage,
    });
    if (result.success === false)
      throw TransformerError.from({
        code: "nestia.core.TypedFormData.Body",
        errors: result.errors,
      });

    const files: IRequestFormDataProps.IFile[] =
      result.data.objects[0]!.type.properties.filter(
        (p) =>
          isFile(p.value) || p.value.arrays.some((a) => isFile(a.type.value)),
      ).map((p) => ({
        name: p.key.constants[0]!.values[0]!.value as string,
        limit: !!p.value.natives.length ? 1 : null,
      }));

    // GENERATE VALIDATION PLAN
    const parameter =
      (key: IRequestFormDataProps<any>["validator"]["type"]) =>
      (
        programmer: (next: {
          context: ITypiaContext;
          modulo: ts.LeftHandSideExpression;
          type: ts.Type;
          name: string | undefined;
        }) => ts.Expression,
      ) =>
        ts.factory.createObjectLiteralExpression(
          [
            ts.factory.createPropertyAssignment(
              ts.factory.createIdentifier("files"),
              LiteralFactory.write(files),
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
                ],
                true,
              ),
            ),
          ],
          true,
        );

    // RETURNS
    const category = props.context.options.validate;
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

const isFile = (meta: MetadataSchema) =>
  meta.natives.some(({ name }) => name === "File" || name === "Blob");
