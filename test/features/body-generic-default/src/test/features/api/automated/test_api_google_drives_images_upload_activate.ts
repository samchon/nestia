import typia from "typia";

import api from "../../../../api";
import type { IGoogleTokenActivate } from "../../../../api/structures/IGoogleTokenActivate";

export const test_api_google_drives_images_upload_activate = async (
  connection: api.IConnection,
) => {
  const output = await api.functional.google.drives.images.upload.activate(
    connection,
    typia.random<string>(),
    typia.random<IGoogleTokenActivate<"google-auth">>(),
  );
  typia.assert(output);
};
