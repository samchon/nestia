import { Module } from "@nestjs/common";

import { Creator } from "../typings/Creator";
import { load_controllers } from "./internal/load_controller";

export namespace DynamicModule {
    export async function mount(path: string): Promise<object> {
        // LOAD CONTROLLERS
        const controllers: Creator<object>[] = await load_controllers(path);

        // RETURN WITH DECORATING
        @Module({ controllers })
        class NestiaModule {}
        return NestiaModule;
    }
}
