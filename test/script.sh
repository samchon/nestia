#-------------------------------------------------------
# EXPERIMENTAL PROJECTS
#-------------------------------------------------------
# ALIAS WITHOUT "TSCONFIG-PATHS" IS POSSIBLE, BECAUSE SCALABILITY OF THE CODES IS SMALL
cd alias@api
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"

# ALIAS WITOUT "TSCONFIG-PATHS" OCCURES "MODULE-NOT-FOUND" ERROR
# IT'S BECAUSE SCALABILITY OF THE CODES IS HUGE
# HOWEVER, THE "TSCONFIG-PATHS" ENFORCES "TSCONFIG.JSON" WITH "BASEURL" OPTION
cd ../alias@src
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"

#-------------------------------------------------------
# NORMAL PROJECTS
#-------------------------------------------------------
cd ../default
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"

cd ../tsconfig.json
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --out "src/api"

cd ../nestia.config.ts
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk

cd ../exclude
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/controllers" --exclude "src/controllers/**/throw_error.ts" --out "src/api"

cd ../reference
npx rimraf src/api/functional
npx ts-node ../../src/bin/nestia sdk "src/**/*.controller.ts" --out "src/api"