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
