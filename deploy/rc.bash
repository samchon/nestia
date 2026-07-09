#!/bin/bash
set -e
bash deploy/README.bash

pnpm --filter=./packages/* -r publish --tag rc --access public --no-git-checks "$@"
