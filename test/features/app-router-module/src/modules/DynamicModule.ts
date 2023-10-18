import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";

import { BbsModule } from "./BbsModule";
import { CommonModule } from "./CommonModule";

@Module({
    imports: [
        RouterModule.register([
            {
                path: "common",
                module: CommonModule,
            },
            {
                path: "bbs",
                module: BbsModule,
                children: [
                    {
                        path: "again",
                        module: CommonModule,
                    },
                ],
            },
        ]),
    ],
})
export class DynamicModule {}
