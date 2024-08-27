import { Backend } from "../Backend";

const bootstrap = async () => {
  await new Backend().open();
};
bootstrap();
