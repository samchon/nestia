import { INestiaConfig } from "@nestia/sdk";

export const NESTIA_CONFIG: INestiaConfig = {
  input: ["src/controllers"],
  output: "src/api",
  e2e: "src/test",
  swagger: {
    output: "swagger.json",
    info: {
      title: "Nestia Swagger Generation Test",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Server",
      },
    ],
    security: {
      bearer: {
        type: "apiKey",
      },
    },
  },
};
export default NESTIA_CONFIG;
