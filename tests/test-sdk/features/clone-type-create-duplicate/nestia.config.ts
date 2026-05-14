import type nestia from "@nestia/sdk";

const NESTIA_CONFIG: nestia.INestiaConfig = {
  input: "src/controller",
  output: "./sdk",
  simulate: false,
  propagate: false,
  clone: true,
  primitive: true,
  json: false,
  swagger: {
    openapi: "3.0",
    decompose: true,
    output: "swagger.json",
    info: {
      title: "nestia test template",
      description: "클론모드에서 발생하는 타입 중복 생성 문제 테스트",
    },
    servers: [{ url: "http://localhost:4000", description: "Local Server" }],
    security: {
      bearer: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
};

export default NESTIA_CONFIG;
