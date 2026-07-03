#!/bin/bash
set -e
bash deploy/README.bash

pnpm bumpp "$1" --no-commit --no-tag --no-push --recursive --yes
pnpm --filter=./packages/* -r publish --tag rc --access public --no-git-checks