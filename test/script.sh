#-------------------------------------------------------
# EXPERIMENTAL PROJECTS
#-------------------------------------------------------
cd alias@api
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"
echo "alias@api"

cd ../alias@src
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"
echo "alias@src"

#-------------------------------------------------------
# NORMAL PROJECTS
#-------------------------------------------------------
cd ../default
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"
echo "default"

cd ../tsconfig.json
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"
echo "tsconfig.json"

cd ../nestia.config.ts
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk
echo "nestia.config.ts"

cd ../exclude
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --exclude "src/controllers/**/throw_error.ts" --out "src/api"
echo "exclude"

cd ../reference
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/**/*.controller.ts" --out "src/api"
echo "reference"