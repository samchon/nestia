import { Module } from "@nestjs/common";

import { DynamicModule } from "./DynamicModule";

@Module({
    imports: [DynamicModule],
})
export class ApplicationModule {}
