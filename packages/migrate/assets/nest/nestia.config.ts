// nestia configuration file
import type sdk from "@nestia/sdk";
import { NestFactory } from "@nestjs/core";

import { MyModule } from "./src/MyModule";

const NESTIA_CONFIG: sdk.INestiaConfig = {
  input: () => NestFactory.create(MyModule),
  output: "src/api",
  swagger: {
    output: "packages/api/swagger.json",
    servers: [
      {
        url: "http://localhost:37001",
        description: "Local Server",
      },
    ],
    beautify: true,
  },
  distribute: "packages/api",
  keyword: true,
  simulate: true,
  primitive: false,
};
export default NESTIA_CONFIG;
