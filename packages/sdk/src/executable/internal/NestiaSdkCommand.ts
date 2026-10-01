import { INestiaConfig } from "../../INestiaConfig";
import { NestiaSdkApplication } from "../../NestiaSdkApplication";
import { NestiaConfigLoader } from "./NestiaConfigLoader";
import { NestiaSdkWatcher } from "./NestiaSdkWatcher";

/**
 * The commands of the `nestia` CLI that run the generators: `sdk`, `swagger`,
 * `e2e`, and `all`.
 *
 * @evidence contracts/common.md#principled-implementation Each command loads the configurations, keeps the ones that can generate what it needs, and runs the application; `swagger` can watch.
 * @evidence contracts/common.md#clear-and-simple-design Four commands over one private runner and two argument readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The commands differ only by title, validation, and generator.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace NestiaSdkCommand {
  /**
   * Runs the generator of the SDK library for every valid configuration.
   *
   * With several configurations, those that cannot generate this output are
   * skipped, and it is an error when none can.
   *
   * @evidence contracts/common.md#principled-implementation The project and configuration files come from the `--project` and `--config` flags with defaults, each flag's value is checked, and the shared runner applies the configurations in order.
   * @evidence contracts/common.md#clear-and-simple-design One binding of the shared runner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The behavior follows the flags and the configuration.
   * @evidence contracts/common.md#meaningful-documentation The comment states what is generated and the skipping rule.
   */
  export const sdk = () =>
    main({
      title: "SDK library",
      generate: (app) => app.sdk(),
      validate: (config) => !!config.output,
      solution: "configure INestiaConfig.output property.",
    });

  /**
   * Runs the generator of the Swagger document, optionally in watch mode for
   * every valid configuration.
   *
   * With several configurations, those that cannot generate this output are
   * skipped, and it is an error when none can.
   *
   * @evidence contracts/common.md#principled-implementation The project and configuration files come from the `--project` and `--config` flags with defaults, each flag's value is checked, and the shared runner applies the configurations in order.
   * @evidence contracts/common.md#clear-and-simple-design One binding of the shared runner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The behavior follows the flags and the configuration.
   * @evidence contracts/common.md#meaningful-documentation The comment states what is generated and the skipping rule.
   */
  export const swagger = () =>
    main({
      title: "Swagger Document",
      generate: (app) => app.swagger(),
      validate: (config) => !!config.swagger?.output,
      solution: "configure INestiaConfig.swagger property.",
      watch: hasFlagArgument("watch"),
    });

  /**
   * Runs the generator of the e2e test functions for every valid configuration.
   *
   * With several configurations, those that cannot generate this output are
   * skipped, and it is an error when none can.
   *
   * @evidence contracts/common.md#principled-implementation The project and configuration files come from the `--project` and `--config` flags with defaults, each flag's value is checked, and the shared runner applies the configurations in order.
   * @evidence contracts/common.md#clear-and-simple-design One binding of the shared runner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The behavior follows the flags and the configuration.
   * @evidence contracts/common.md#meaningful-documentation The comment states what is generated and the skipping rule.
   */
  export const e2e = () =>
    main({
      title: "E2E Functions",
      generate: (app) => app.e2e(),
      validate: (config) => !!config.e2e,
      solution: [
        "configure two properties:",
        "",
        "  - INestiaConfig.output",
        "  - INestiaConfig.e2e",
      ].join("\n"),
    });

  /**
   * Runs the generator of everything the configurations ask for for every valid
   * configuration.
   *
   * With several configurations, those that cannot generate this output are
   * skipped, and it is an error when none can.
   *
   * @evidence contracts/common.md#principled-implementation The project and configuration files come from the `--project` and `--config` flags with defaults, each flag's value is checked, and the shared runner applies the configurations in order.
   * @evidence contracts/common.md#clear-and-simple-design One binding of the shared runner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The behavior follows the flags and the configuration.
   * @evidence contracts/common.md#meaningful-documentation The comment states what is generated and the skipping rule.
   */
  export const all = () =>
    main({
      title: "everything",
      generate: (app) => app.all(),
      validate: () => true,
      solution: [
        "configure at least one property of below:",
        "",
        "  - INestiaConfig.output",
        "  - INestiaConfig.swagger.output",
      ].join("\n"),
    });

  const main = async (props: {
    title: string;
    solution: string;
    generate: (app: NestiaSdkApplication) => Promise<void>;
    validate: (config: INestiaConfig) => boolean;
    watch?: boolean;
  }) => {
    // LOAD CONFIG INFO
    const project: string =
      getFileArgument({
        type: "project",
        extension: "json",
      }) ?? "tsconfig.json";
    process.env.NESTIA_PROJECT = project;
    const configFile: string =
      getFileArgument({
        type: "config",
        extension: "ts",
      }) ?? "nestia.config.ts";
    const configurations = async (): Promise<INestiaConfig[]> => {
      const command: NestiaConfigLoader.ICompilerOptions =
        await NestiaConfigLoader.compilerOptions(project);
      return NestiaConfigLoader.configurations(
        configFile,
        command.raw.compilerOptions ?? {},
      );
    };
    const generate = async (configurations: INestiaConfig[]): Promise<void> => {
      if (
        configurations.length > 1 &&
        configurations.some(props.validate) === false
      )
        throw new Error(
          `Every configurations are invalid to generate ${props.title}, ${props.solution}`,
        );
      for (const config of configurations) {
        if (configurations.length > 1 && props.validate(config) === false)
          continue;
        const app: NestiaSdkApplication = new NestiaSdkApplication(config);
        await props.generate(app);
      }
    };

    if (props.watch === true)
      return NestiaSdkWatcher.watch({
        configFile,
        configurations,
        generate,
        projectFile: project,
      });

    await generate(await configurations());
  };

  const getFileArgument = (props: {
    type: string;
    extension: string;
  }): string | null => {
    const argv: string[] = process.argv.slice(3);
    const index: number = argv.findIndex((str) => str === `--${props.type}`);
    if (index === -1) return null;

    // Bound the VALUE position, not the whole argument list. The two only
    // coincide when the flag is the sole argument, so any preceding token used
    // to send `undefined` into endsWith() and report a TypeError instead of this
    // diagnostic. A following flag is a missing value too, not a badly named
    // file.
    const file: string | undefined = argv[index + 1];
    if (file === undefined || file.startsWith("--"))
      throw new Error(`${props.type} file must be provided`);
    if (file.endsWith(props.extension) === false)
      throw new Error(`${props.type} file must be ${props.extension} file`);
    return file;
  };

  const hasFlagArgument = (type: string): boolean =>
    process.argv.slice(3).some((str) => str === `--${type}`);
}
