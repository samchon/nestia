import { INestiaConfig } from "../INestiaConfig";

export namespace NestiaConfigUtil {
    export const input = (
        config: INestiaConfig["input"],
    ): INestiaConfig.IInput =>
        Array.isArray(config)
            ? {
                  include: config,
                  exclude: [],
              }
            : typeof config === "object"
            ? {
                  include: config.include,
                  exclude: config.exclude ?? [],
              }
            : {
                  include: [config],
                  exclude: [],
              };
}
