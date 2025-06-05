import type { Format } from "typia/lib/tags/Format";
import type { Type } from "typia/lib/tags/Type";

export type IMultipart = {
  id: string & Format<"uuid">;
  strings: string[];
  number: number;
  integers: (number & Type<"int32">)[];
  blob: Blob;
  blobs: Blob[];
  file: File;
  files: File[];
};
