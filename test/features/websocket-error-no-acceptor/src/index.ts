import { Backend } from "./Backend";

const main = async () => {
  await new Backend().open();
};
main().catch((exp) => {
  console.error(exp);
  process.exit(-1);
});
