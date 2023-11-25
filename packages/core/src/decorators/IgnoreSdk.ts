import { SetMetadata } from "@nestjs/common";

export const IGNORE_SDK_METADATA = "ExcludeFromSdk";
export const IgnoreSdk = () => SetMetadata(IGNORE_SDK_METADATA, true);
