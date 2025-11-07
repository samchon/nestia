import ts from "typescript";

import { INestiaConfig } from "../../INestiaConfig";
import { NestiaSdkApplication } from "../../NestiaSdkApplication";
import { NestiaConfigLoader } from "./NestiaConfigLoader";

export namespace NestiaSdkCommand {
  export const sdk = () =>
    main({
      title: "SDK library",
      generate: (app) => app.sdk(),
      validate: (config) => !!config.output,
      solution: "configure INestiaConfig.output property.",
    });
  export const swagger = () =>
    main({
      title: "Swagger Document",
      generate: (app) => app.swagger(),
      validate: (config) => !!config.swagger?.output,
      solution: "configure INestiaConfig.swagger property.",
    });
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
  }) => {
    // LOAD CONFIG INFO
    const command: ts.ParsedCommandLine =
      await NestiaConfigLoader.compilerOptions(
        getFileArgument({
          type: "project",
          extension: "json",
        }) ?? "tsconfig.json",
      );
    const configurations: INestiaConfig[] =
      await NestiaConfigLoader.configurations(
        getFileArgument({
          type: "config",
          extension: "ts",
        }) ?? "nestia.config.ts",
        command.raw.compilerOptions,
      );

    // GENERATE
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

  const getFileArgument = (props: {
    type: string;
    extension: string;
  }): string | null => {
    const argv: string[] = process.argv.slice(3);
    if (argv.length === 0) return null;

    const index: number = argv.findIndex((str) => str === `--${props.type}`);
    if (index === -1) return null;
    else if (argv.length === 1)
      throw new Error(`${props.type} file must be provided`);

    const file: string = argv[index + 1];
    if (file.endsWith(props.extension) === false)
      throw new Error(`${props.type} file must be ${props.extension} file`);
    return file;
  };
}
