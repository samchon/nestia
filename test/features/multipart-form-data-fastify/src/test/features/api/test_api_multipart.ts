import api from "@api";

export const test_api_multipart = async (
  connection: api.IConnection,
): Promise<void> => {
  await api.functional.multipart.post(connection, {
    title: "something",
    blob: new Blob([new Uint8Array(999).fill(0)]),
    blobs: new Array(10)
      .fill(0)
      .map((_, i) => new Blob([new Uint8Array(999).fill(i)])),
    description: "nothing",
    file: new File([new Uint8Array(999).fill(1)], "first.png"),
    files: new Array(10)
      .fill(0)
      .map((_, i) => new File([new Uint8Array(999).fill(i)], `${i}.png`)),
    notes: ["note1", "note2"],
  });
};
