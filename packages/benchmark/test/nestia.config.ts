// nestia configuration file
import type sdk from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";

import { BbsArticleModule } from "./controllers/bbs/BbsArticleModule";

const NESTIA_CONFIG: sdk.INestiaConfig = {
  input: () => NestFactory.create(BbsArticleModule),
  output: "src/api",
  primitive: false,
};
export default NESTIA_CONFIG;
