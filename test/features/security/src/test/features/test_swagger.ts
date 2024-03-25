import typia from "typia";

export const test_swagger = async () => {
  const swagger = await import("../../../swagger.json");
  typia.assertEquals<[{ basic: [] }]>(swagger.paths["/basic"].get.security);
  typia.assertEquals<[{ basic: [] }]>(
    swagger.paths["/basic_by_comment"].get.security,
  );
  typia.assertEquals<[{ bearer: [] }]>(swagger.paths["/bearer"].get.security);
  typia.assertEquals<[{ bearer: [] }]>(
    swagger.paths["/bearer_by_comment"].get.security,
  );
  typia.assertEquals<[{ oauth2: ("write:pets" | "read:pets")[] }]>(
    swagger.paths["/oauth2"].get.security,
  );
  typia.assertEquals<[{ oauth2: ("write:pets" | "read:pets")[] }]>(
    swagger.paths["/oauth2_by_comment"].get.security,
  );
  typia.assertEquals<[{}, { bearer: [] }]>(
    swagger.paths["/optional_by_comment"].get.security,
  );

  if (undefined !== (swagger.paths["/security"].get as any).security)
    throw Error("/security have to empty.");
};
