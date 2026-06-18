import { type Statement, SyntaxKind, factory } from "@ttsc/factory";
import { OpenApi } from "@typia/interface";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { FilePrinter } from "../utils/FilePrinter";
import { StringUtil } from "../utils/StringUtil";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";
import { NestiaMigrateNestMethodProgrammer } from "./NestiaMigrateNestMethodProgrammer";

export namespace NestiaMigrateNestControllerProgrammer {
  export interface IProps {
    config: INestiaMigrateConfig;
    components: OpenApi.IComponents;
    controller: INestiaMigrateController;
  }

  export const write = (props: IProps): Statement[] => {
    const importer: NestiaMigrateImportProgrammer =
      new NestiaMigrateImportProgrammer();
    const $class = factory.createClassDeclaration(
      [
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier(
              importer.external({
                type: "instance",
                library: "@nestjs/common",
                name: "Controller",
              }),
            ),
            [],
            [factory.createStringLiteral(props.controller.path)],
          ),
        ),
        factory.createToken(SyntaxKind.ExportKeyword),
      ],
      props.controller.name,
      [],
      [],
      props.controller.routes
        .map((route, index) => [
          ...(index !== 0 ? [FilePrinter.newLine() as any] : []),
          (
            props.config.programmer?.controllerMethod ??
            NestiaMigrateNestMethodProgrammer.write
          )({
            config: props.config,
            components: props.components,
            controller: props.controller,
            importer,
            route,
          }),
        ])
        .flat(),
    );
    return [
      ...importer.toStatements(
        (ref) =>
          `${"../".repeat(
            StringUtil.splitWithNormalization(props.controller.location)
              .length - 1,
          )}api/structures/${ref}`,
      ),
      ...(importer.empty() ? [] : [FilePrinter.newLine()]),
      $class,
    ];
  };
}
