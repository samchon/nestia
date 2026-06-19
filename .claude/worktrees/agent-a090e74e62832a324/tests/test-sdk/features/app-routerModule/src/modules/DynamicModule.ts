import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";

import { BbsModule } from "./BbsModule";
import { CalculateModule } from "./CalculateModule";
import { CommonModule } from "./CommonModule";

@Module({
  imports: [
    CommonModule,
    BbsModule,
    CalculateModule,
    RouterModule.register([
      {
        path: "common",
        module: CommonModule,
      },
      {
        path: "bbs",
        module: BbsModule,
      },
      {
        path: "websocket",
        module: CalculateModule,
      },
    ]),
  ],
})
export class DynamicModule {}
