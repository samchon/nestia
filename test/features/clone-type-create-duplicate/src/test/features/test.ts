export const test = async () => {
  const swagger = await import("../../../swagger.json");
  const ok = ["Exception.Unauthorized", "IAuth.IAccount", "IUser.IProfile"];
  if (Object.keys(swagger.components.schemas).some((key) => !ok.includes(key)))
    throw Error("schema was generated duplicately");
};
