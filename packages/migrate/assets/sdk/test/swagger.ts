import express from "express";
import ui from "swagger-ui-express";

import swagger from "../swagger.json";

const main = async (): Promise<void> => {
  const app = express();
  app.use("/", ui.serve, ui.setup(swagger));
  app.listen(3000);

  console.log("-----------------------------------------------------------");
  console.log("\n Swagger UI Address: http://127.0.0.1:3000 \n");
  console.log("-----------------------------------------------------------");
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
