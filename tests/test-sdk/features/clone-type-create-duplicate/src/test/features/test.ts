import fs from "fs";
export const test = async () => {
  const swagger = JSON.parse(await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"));
  const ok = ["Exception.Unauthorized", "IAuth.IAccount", "IUser.IProfile"];
  if (Object.keys(swagger.components.schemas).some((key) => !ok.includes(key)))
    console.error("schema was generated duplicately");
};
