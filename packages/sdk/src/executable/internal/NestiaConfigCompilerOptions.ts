export namespace NestiaConfigCompilerOptions {
    /* -----------------------------------------------------------
        DEFAULT VALUES
    ----------------------------------------------------------- */
    const ESSENTIAL_OPTIONS = {
        types: ["node", "reflect-metadata"],
        noEmit: true,
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
    };

    export const DEFAULT_OPTIONS = {
        ...ESSENTIAL_OPTIONS,
        target: "es5",
        module: "commonjs",
    };
}
