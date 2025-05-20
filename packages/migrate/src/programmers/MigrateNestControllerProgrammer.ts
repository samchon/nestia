import { OpenApi } from "@samchon/openapi";
import ts from "typescript";

import { IHttpMigrateController } from "../structures/IHttpMigrateController";
import { FilePrinter } from "../utils/FilePrinter";
import { StringUtil } from "../utils/StringUtil";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateNestMethodProgrammer } from "./MigrateNestMethodProgrammer";

export namespace MigrateNestControllerProgrammer {
  export const write =
    (components: OpenApi.IComponents) =>
    (controller: IHttpMigrateController): ts.Statement[] => {
      const importer: MigrateImportProgrammer = new MigrateImportProgrammer();
      const $class = ts.factory.createClassDeclaration(
        [
          ts.factory.createDecorator(
            ts.factory.createCallExpression(
              ts.factory.createIdentifier(
                importer.external({
                  type: "instance",
                  library: "@nestjs/common",
                  name: "Controller",
                }),
              ),
              [],
              [ts.factory.createStringLiteral(controller.path)],
            ),
          ),
          ts.factory.createToken(ts.SyntaxKind.ExportKeyword),
        ],
        controller.name,
        [],
        [],
        controller.routes
          .map((route, index) => [
            ...(index !== 0 ? [FilePrinter.newLine() as any] : []),
            MigrateNestMethodProgrammer.write(components)(importer)(controller)(
              route,
            ),
          ])
          .flat(),
      );
      return [
        ...importer.toStatements(
          (ref) =>
            `${"../".repeat(
              StringUtil.splitWithNormalization(controller.location).length - 1,
            )}api/structures/${ref}`,
        ),
        ...(importer.empty() ? [] : [FilePrinter.newLine()]),
        $class,
      ];
    };
}
