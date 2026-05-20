// Package sdk implements the `@nestia/sdk` ttsc transform plugin: it injects
// the `@OperationMetadata({...})` decorator the SDK / Swagger / e2e generators
// read at runtime. It is a separate plugin from `@nestia/core` so that a
// project depending only on `@nestia/core` never compiles this code — see
// `packages/core/native/transform` for the shared transform infrastructure
// this package imports.
package sdk

import (
	"io"
	"os"
)

var (
	stdout io.Writer = os.Stdout
	stderr io.Writer = os.Stderr
)
