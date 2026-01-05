import api from "@api";

export const test_accessor_escape = (): void => {
  api.functional._delete.erase.METADATA;
};
