#--------------------------------------------------
# PACKAGES
#--------------------------------------------------
cd ../packages/fetcher
npm install
npm run build
npm publish --access public --tag latest

cd ../core
npm install
npm run build
npm publish --access public --tag latest

cd ../sdk
npm install
npm run build
npm publish --access public --tag latest

#--------------------------------------------------
# TEMPLATE REPOSITORY
#--------------------------------------------------
cd ../..
cd ../nestia-template

git checkout master
git pull
npm install
npm install --save typia@latest
npm install --save @nestia/core@latest
npm install --save-dev @nestia/sdk@latest

cd packages/api
npm install
npm install --save typia@latest
npm install --save @nestia/fetcher@latest

cd ../..
npm run build
npm run test
git add .
git commit -m "Update dependencies"
git push

#--------------------------------------------------
# MIGRATE
#--------------------------------------------------
cd ../nestia/packages/migrate
npm install
npm install --save typia@latest
npm install --save-dev @nestia/core@latest
npm install --save-dev @nestia/fetcher@latest
npm run build
npm publish --access public --tag latest
