import { SyntaxKind, factory } from "@ttsc/factory";
import { OpenApi } from "@typia/interface";

import ts from "../internal/ts";
import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";
import { NestiaMigrateNestMethodProgrammer } from "./NestiaMigrateNestMethodProgrammer";

/**
 * Generates the source of one NestJS controller.
 *
 * @evidence contracts/common.md#principled-implementation The controller class is decorated with `@Controller` and its path, each route becomes a method written by the configured method programmer or the default one, and the DTO types are imported by package name because they live in the API package.
 * @evidence contracts/common.md#clear-and-simple-design One function; the method programmer is replaceable through the configuration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The replaceable programmer is a documented extension point.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is generated.
 */
export namespace NestiaMigrateNestControllerProgrammer {
  /**
   * The input of one controller: the configuration, the components, and the
   * controller.
   *
   * @evidence contracts/common.md#principled-implementation The record holds exactly what the generation needs.
   * @evidence contracts/common.md#clear-and-simple-design A flat record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment lists the fields.
   */
  export interface IProps {
    config: INestiaMigrateConfig;
    components: OpenApi.IComponents;
    controller: INestiaMigrateController;
  }

  /**
   * Returns the statements of a controller file.
   *
   * @evidence contracts/common.md#principled-implementation Blank lines separate the methods, and the imports come first.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The content follows the controller.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
  export const write = (props: IProps): ts.Statement[] => {
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
      // Controllers live in the backend workspace package while the DTO
      // structures belong to the api package, so the types must be imported
      // through the package name instead of a relative path.
      ...importer.toStatements(() => "@ORGANIZATION/PROJECT-api"),
      ...(importer.empty() ? [] : [FilePrinter.newLine()]),
      $class,
    ];
  };
}
