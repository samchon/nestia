import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";

import { BbsModule } from "./BbsModule";
import { CommonModule } from "./CommonModule";

@Module({
    imports: [
        CommonModule,
        BbsModule,
        RouterModule.register([
            {
                path: "common",
                module: CommonModule,
            },
            {
                path: "bbs",
                module: BbsModule,
            },
        ]),
    ],
})
export class DynamicModule {}
