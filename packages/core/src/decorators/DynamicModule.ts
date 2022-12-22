import { Module } from "@nestjs/common";
import { ModuleMetadata } from "@nestjs/common/interfaces";

import { Creator } from "../typings/Creator";
import { load_controllers } from "./internal/load_controller";

export namespace DynamicModule {
    export async function mount(
        path: string,
        options: Omit<ModuleMetadata, "controllers"> = {},
    ): Promise<object> {
        // LOAD CONTROLLERS
        const controllers: Creator<object>[] = await load_controllers(path);

        // RETURN WITH DECORATING
        @Module({ ...options, controllers })
        class NestiaModule {}
        return NestiaModule;
    }
}
