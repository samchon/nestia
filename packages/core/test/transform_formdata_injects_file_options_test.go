package test

import "testing"

// TestTransformFormDataInjectsFileOptions verifies the @TypedFormData.Body
// generator walks the multipart DTO and injects per-field file options through
// nestiaCoreFormDataFiles / nestiaCoreGenerateTypedFormDataBody.
//
// The generator distinguishes singular file members (limit 1) from array
// members (limit null) by walking the form DTO. A regression in member-kind
// detection silently falls back to a uniform option set and breaks downstream
// multer wiring while still compiling, so only this per-member assertion pins
// the shape.
//
//  1. Transform the multipart feature's MultipartController with validate "assert".
//  2. Read the emitted --out source.
//  3. Assert each per-field name plus both limit shapes appear.
//
// @evidence contracts/testing.md#behavioral-verification The multipart fixture transform must inject the Multer decorator options with all four blob/file field names and both singleton and unbounded limits.
// @evidence contracts/testing.md#independent-expectations The handwritten multipart DTO has singular and array Blob/File members; singular means limit 1 and arrays mean unbounded, independently of emitted code.
// @evidence contracts/testing.md#distinguishing-cases This covers singular/array and Blob/File collection metadata; invalid nested form data has its diagnostic case, while SDK multipart HTTP cases own wire handling.
// @evidence contracts/testing.md#execution-ownership The core Go runner discovers this Test and invokes the native dispatcher in-process. The loaded fixture program and temporary emitted output exercise transformation without building or launching a native host; the generated-validator runtime batch owns installed-helper execution.
func TestTransformFormDataInjectsFileOptions(t *testing.T) {
	out := transformFileToString(t, "multipart-form-data", "MultipartController.ts", "assert", "assert")
	mustContainAll(t, out,
		"@core.TypedFormData.Body(() => Multer(), {",
		`name: "blob"`,
		`name: "blobs"`,
		`name: "file"`,
		`name: "files"`,
		"limit: 1",
		"limit: null",
	)
}
