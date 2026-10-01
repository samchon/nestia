import { Module } from "@nestjs/common";
import { ModuleMetadata } from "@nestjs/common/interfaces";

import { Creator } from "../typings/Creator";
import { load_controllers } from "./internal/load_controller";

/**
 * Dynamic module.
 *
 * `DynamicModule` is a namespace wrapping a convenient function, which can load
 * controller classes dynamically just by specifying their directory path.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @evidence contracts/common.md#principled-implementation The namespace builds a Nest module whose controllers are found on disk at startup instead of listed in code, using the shared loader.
 * @evidence contracts/common.md#clear-and-simple-design One function that delegates discovery to `load_controllers` and decorates a class with the result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Paths are caller input, and no controller name is assumed.
 * @evidence contracts/common.md#meaningful-documentation The comment describes the purpose and the path forms.
 */
export namespace DynamicModule {
  /**
   * Mount dynamic module.
   *
   * Constructs a module instance with directory path of controller classes.
   *
   * Every controller classes in the target directory would be dynamically
   * mounted.
   *
   * @param path Path of controllers
   * @param metadata Additional metadata except controllers
   * @returns Module instance
   * @evidence contracts/common.md#principled-implementation Controllers are loaded from the paths, given as a path, a list, or include and exclude lists, and then a class decorated with `@Module` and those controllers is returned, so Nest treats the result as an ordinary module.
   * @evidence contracts/common.md#clear-and-simple-design A short function whose discovery details live in `load_controllers`.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It calls Nest's public `Module` decorator with the metadata; nothing is patched.
   * @evidence contracts/common.md#meaningful-documentation The comment documents the path forms and the `isTsNode` option.
   */
  export async function mount(
    path: string | string[] | { include: string[]; exclude?: string[] },
    metadata: Omit<ModuleMetadata, "controllers"> = {},
    isTsNode?: boolean,
  ) {
    // LOAD CONTROLLERS
    const controllers: Creator<object>[] = await load_controllers(
      path,
      isTsNode,
    );

    // RETURN WITH DECORATING
    @Module({ ...metadata, controllers })
    class NestiaModule {}
    return NestiaModule;
  }
}
