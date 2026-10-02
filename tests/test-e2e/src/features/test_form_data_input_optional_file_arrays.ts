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
 *
 * @evidence contracts/testing.md#behavioral-verification TypeScript checks assignments against the public FormDataInput transformation; the optional descriptor-array assignment fails when the array conversion examines File[] or undefined as a single nondistributive domain. The exported function enrolls the source in the existing test population; no runtime result is claimed for these type assertions.
 * @evidence contracts/testing.md#independent-expectations The documented React Native form contract permits IFileProps in place of each File and preserves optional absence and nonfile alternatives. Authored positive assignments and expected compiler errors encode that contract independently of the mapped type implementation.
 * @evidence contracts/testing.md#distinguishing-cases Required, optional, empty and scalar-or-array union fields accept descriptors; undefined and omission remain valid, strings remain valid only in their declared union, and numeric file elements and a boolean scalar alternative are rejected.
 * @evidence contracts/testing.md#execution-ownership This compile-only type regression lives beside the existing direct fetcher cases in test-e2e/src/features and its matching test-prefixed function is discovered by DynamicExecutor. TypeScript compilation owns its assignability assertions; invocation requires no host, installation or network boundary.
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
