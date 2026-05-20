// Command ttsc-nestia-sdk is a test-support host binary: the `@nestia/core`
// transform host (`transform.Run`) with the `@nestia/sdk` contributor
// statically linked via a blank import.
//
// ttsc never builds this — it links the contributor into the real host on its
// own. `packages/sdk/test` builds and runs this so the SDK transform can be
// exercised directly, without reproducing ttsc's contributor-linking pipeline.
// It is not part of the published `@nestia/sdk` package.
package main

import (
	"os"

	"github.com/samchon/nestia/packages/core/native/transform"
	_ "github.com/samchon/nestia/packages/sdk/native/sdk"
)

func main() {
	os.Exit(transform.Run(os.Args[1:]))
}
