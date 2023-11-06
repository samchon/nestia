import ts from "typescript";

import { JsonMetadataFactory } from "typia/lib/factories/JsonMetadataFactory";
import { AssertProgrammer } from "typia/lib/programmers/AssertProgrammer";
import { IsProgrammer } from "typia/lib/programmers/IsProgrammer";
import { ValidateProgrammer } from "typia/lib/programmers/ValidateProgrammer";
import { MiscAssertCloneProgrammer } from "typia/lib/programmers/misc/MiscAssertCloneProgrammer";
import { MiscAssertPruneProgrammer } from "typia/lib/programmers/misc/MiscAssertPruneProgrammer";
import { MiscValidateCloneProgrammer } from "typia/lib/programmers/misc/MiscValidateCloneProgrammer";
import { MiscValidatePruneProgrammer } from "typia/lib/programmers/misc/MiscValidatePruneProgrammer";
import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { IRequestBodyValidator } from "../options/IRequestBodyValidator";

export namespace TypedBodyProgrammer {
    export const generate =
        (project: INestiaTransformProject) =>
        (modulo: ts.LeftHandSideExpression) =>
        (type: ts.Type): ts.ObjectLiteralExpression => {
            // VALIDATE TYPE
            JsonMetadataFactory.analyze("@nestia.core.TypedBody")(
                project.checker,
            )(type);

            // GENERATE VALIDATION PLAN
            const check =
                (key: IRequestBodyValidator<any>["type"]) =>
                (equals: boolean) =>
                (
                    programmer: (
                        project: IProject,
                    ) => (
                        modulo: ts.LeftHandSideExpression,
                    ) => (
                        equals: boolean,
                    ) => (type: ts.Type) => ts.ArrowFunction,
                ) =>
                    ts.factory.createObjectLiteralExpression([
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
                            })(modulo)(equals)(type),
                        ),
                    ]);
            const misc =
                (key: IRequestBodyValidator<any>["type"]) =>
                (
                    programmer: (
                        project: IProject,
                    ) => (
                        modulo: ts.LeftHandSideExpression,
                    ) => (type: ts.Type) => ts.ArrowFunction,
                ) =>
                    ts.factory.createObjectLiteralExpression([
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
                    ]);

            //----
            // RETURNS
            //----
            const category = project.options.validate;
            // NORMAL
            if (category === "is")
                return check("is")(false)(IsProgrammer.write);
            else if (category === "validate")
                return check("validate")(false)(ValidateProgrammer.write);
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
            return check("assert")(false)(AssertProgrammer.write);
        };
}
