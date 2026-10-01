package test

import "testing"

// TestTransformProjectModeEmitsAllFiles verifies that running transform without
// --file walks every non-declaration source file in the program and emits the
// rewritten TypeScript through the project-mode JSON encoder, exiting 0.
//
// Project mode (runTransformProject) is the seam ttsc uses to ask the host to
// transform a whole program in one shot; it is a distinct path from the single
// --file case and owns the driver.TransformOutputKey filtering plus the JSON
// output envelope. A regression that skipped files or miskeyed the map would
// corrupt the bulk transform contract. Driving it with a feature program pins
// the success branch.
//
//  1. Run transform against the body feature's own tsconfig with no --file.
//  2. Decode the clean envelope and require nonempty outputs for its three
//     controllers and article DTO, with no diagnostics.
//
// @evidence contracts/testing.md#behavioral-verification The valid body program must return a decoded project envelope with nonempty body, health, performance and article outputs and no diagnostics, rather than a vacuous successful exit.
// @evidence contracts/testing.md#independent-expectations These four authored files belong to the body fixture program; project-mode transformation publishes each local program source under its relative filename.
// @evidence contracts/testing.md#distinguishing-cases The assertions cover transformed controllers and a declaration-only structure. The invalid-driver project case owns transform diagnostics, and graph tests own input dependency tracking.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against real fixture source. Temporary configuration/output files belong to t.TempDir; no consumer installation or native host process is started.
func TestTransformProjectModeEmitsAllFiles(t *testing.T) {
	envelope := runProjectTransformEnvelope(t, "body")
	for _, source := range []string{
		"src/controllers/TypedBodyController.ts",
		"src/controllers/HealthController.ts",
		"src/controllers/PerformanceController.ts",
		"src/api/structures/IBbsArticle.ts",
	} {
		if text, ok := envelope.TypeScript[source]; !ok || text == "" {
			t.Errorf("project transform omitted nonempty output for %s", source)
		}
	}
	if len(envelope.Diagnostics) != 0 {
		t.Errorf("valid project reported diagnostics: %v", envelope.Diagnostics)
	}
}
