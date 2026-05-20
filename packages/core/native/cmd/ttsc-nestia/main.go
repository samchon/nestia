package main

import (
	"os"

	"github.com/samchon/nestia/packages/core/native/transform"
)

func main() {
	os.Exit(transform.Run(os.Args[1:]))
}
