import typia from "typia";
import type { Primitive } from "typia";

import api from "../../../../api";
import type { IGoogleDriveFile } from "../../../../api/structures/IGoogleDriveFile";
import type { IGoogleDriveImageSingleUpload } from "../../../../api/structures/IGoogleDriveImageSingleUpload";

export const test_api_google_drives_images_upload_single = async (
  connection: api.IConnection,
) => {
  const output: Primitive<IGoogleDriveFile> =
    await api.functional.google.drives.images.upload.single(
      connection,
      typia.random<string>(),
      typia.random<IGoogleDriveImageSingleUpload>(),
    );
  typia.assert(output);
};
