#!/bin/bash
set -e
bash deploy/README.bash

pnpm --filter=./packages/* -r publish --tag next --access public --no-git-checks "$@"
