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
 */
export namespace DynamicModule {
  /**
   * Mount dynamic module.
   *
   * Constructs a module instance with directory path of controller classes.
   *
   * Every controller classes in the target directory would be dynamically mounted.
   *
   * @param path Path of controllers
   * @param metadata Additional metadata except controllers
   * @returns module instance
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
