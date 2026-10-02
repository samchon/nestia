import { FormDataInput } from "@nestia/fetcher";

/**
 * Verifies optional and union file-array fields accept React Native
 * descriptors.
 *
 * The compiler must distribute over an optional array's undefined alternative;
 * testing only a required File array leaves that transformation failure hidden.
 * These are compile-time assignability assertions, not a runtime transport
 * test.
 *
 * 1. Assign descriptors to required, optional and union file-array fields.
 * 2. Preserve omission and scalar alternatives, and reject unrelated elements.
 */
export function test_form_data_input_optional_file_arrays(): void {
  const descriptor: FormDataInput.IFileProps = {
    uri: "file:///upload.txt",
    name: "upload.txt",
    type: "text/plain",
  };
  type Input = FormDataInput<{
    required: File[];
    optional?: File[];
    union?: File[] | string;
    scalar?: File;
  }>;
  const accepted: Input[] = [
    { required: [descriptor], optional: [descriptor], union: [descriptor] },
    {
      required: [],
      optional: undefined,
      union: "existing",
      scalar: descriptor,
    },
    { required: [] },
  ];
  // @ts-expect-error A numeric value cannot replace a File or file descriptor.
  const rejectedElement: Input = { required: [], optional: [42] };
  // @ts-expect-error The scalar alternative permits strings, not booleans.
  const rejectedAlternative: Input = { required: [], union: true };
  void accepted;
  void rejectedElement;
  void rejectedAlternative;
}
