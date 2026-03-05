#!/bin/bash
set -e
bash README.sh

cd ..
pnpm bumpp "$1" --no-commit --no-tag --no-push --recursive --yes
pnpm --filter=./packages/* -r publish --tag next --access public --no-git-checks