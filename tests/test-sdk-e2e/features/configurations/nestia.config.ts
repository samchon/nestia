import { INestiaConfig } from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";

import { ApplicationModule } from "./src/modules/ApplicationModule";
import { BbsModule } from "./src/modules/BbsModule";
import { CommonModule } from "./src/modules/CommonModule";

export const NESTIA_CONFIGURATIONS: INestiaConfig[] = [
  {
    input: () => NestFactory.create(BbsModule),
    output: "src/api/bbs",
    e2e: "src/test",
    swagger: {
      output: "bbs.swagger.json",
      beautify: true,
      security: {
        bearer: {
          type: "apiKey",
        },
      },
    },
  },
  {
    input: () => NestFactory.create(CommonModule),
    output: "src/api/common",
    e2e: "src/test",
    swagger: {
      output: "common.swagger.json",
      beautify: true,
      security: {
        bearer: {
          type: "apiKey",
        },
      },
    },
  },
  // composes CommonModule's routes a second time in the same process
  {
    input: () => NestFactory.create(ApplicationModule),
    swagger: {
      output: "application.swagger.json",
      beautify: true,
    },
  },
];
export default NESTIA_CONFIGURATIONS;
