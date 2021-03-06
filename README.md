<h1 align="center">Rural Road Accessibility Server</h1>

The Rural Roads Accessibility tool allows you to assess the accessibility of rural populations in relation to critical services. Using the [Open Source Routing Machine](http://project-osrm.org), RRA calculates travel times from population centers to the nearest POI.
RRA Server is the main backend of the project and contains the API, database and file storage.

Apart from the RRA Server, the tool relies on the following projects:

1. [rra-frontend](https://github.com/WorldBank-Transport/rra-frontend) with the code for the user interface
2. [rra-datapipeline](https://github.com/WorldBank-Transport/rra-datapipeline) that handles some of the more intensive data processing
3. [rra-iD](https://github.com/WorldBank-Transport/rra-iD), a customized version of iD - the popular OSM editor - to allow editing of the road network

## Installation and Usage
These installation instructions focus on running the RRA Server locally. This readme also contains instructions on [deploying the application to ECS](#deployment-to-ecs).

First time setup:

1. install Node 6, Docker, Docker Compose, python-gdal, python-lxml - [more on project dependencies](#install-project-dependencies)
2. `yarn install` - [more on application dependencies](#install-application-dependencies)
3. add configuration variables to `app/config/local.js`. The [example config](#config-example) should work well.
4. [sudo] `docker network create rra` to set up the Docker network
5. [sudo] `docker-compose up -d` to start the database and bucket in the background - [more on starting the containers](#starting-the-containers)
6. `yarn run setup -- --db --bucket` to setup the database and file storage. If you want to start the server with example data, run `yarn run setup -- --data` instead - [more on setup](#setup)
7. `yarn start` to start the app - [more on starting the app](#starting-the-app)

### Install Project Dependencies
To set up the development environment for this website, you'll need to install the following on your system:

- [Node](http://nodejs.org/) v6.x (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [Yarn](https://yarnpkg.com/) Package manager
- [Docker](https://www.docker.com/products/docker) and [Docker Compose](https://docs.docker.com/compose/install/) v1.10.0
- python-gdal and python-lxml to generate OSM Change files (eg. `$ apt-get install -y python-gdal python-lxml`)

### Install Application Dependencies

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

```
nvm install
```

Install Node modules:

```
yarn install
```

### Configuration
All the config files can be found in `app/config`.
After installing the projects there will be 4 main files:
  - `test.js` - Used for testing. There is typically no need to modify this file.
  - `local.js` - Used only for local development. On production this file should not exist or be empty.
  - `staging.js`
  - `production.js`

The `production.js` file serves as base and will override the staging and local configuration as needed:
  - `staging.js` will be loaded whenever the env variable `DS_ENV` is set to staging.
  - `local.js` will be loaded if it exists.

Some of the following options are overridable by environment variables, expressed between [].
The following options must be set:

  - `connection.host` - The host. (mostly cosmetic. Default to 0.0.0.0). [PORT]
  - `connection.port` - The port where the app runs. (Default 4000). [HOST]
  - `db` - The database connection string. [DB_CONNECTION]
  - `osmP2PDir` - The folder to store the osm-p2p dbs. [OSM_P2P_DIR]
  - `storage` - Object with storage related settings. Has to be s3 compatible.
  - `storage.host` - The host to use. (Default 0.0.0.0). [STORAGE_HOST]
  - `storage.port` - The port to use. (Default 0.0.0.0). [STORAGE_PORT]
  - `storage.engine` - The storage engine to use. Either `minio` or `s3`. [STORAGE_ENGINE]
  - `storage.accessKey` - Access key for the storage. [STORAGE_ACCESS_KEY]
  - `storage.secretKey` - Secret key for storage. [STORAGE_SECRET_KEY]
  - `storage.bucket` - Secret key for storage. [STORAGE_BUCKET]
  - `storage.region` - Secret key for storage. [STORAGE_REGION]
  - `analysisProcess.service` - The service to run the analysis on. Either `docker` (for local development and off-line) or `hyper`. [ANL_SERVICE]
  - `analysisProcess.hyperAccess` - Access key for Hyper. [HYPER_ACCESS]
  - `analysisProcess.hyperSecret` - Secret key for Hyper. [HYPER_SECRET]
  - `analysisProcess.container` - The name of the rra-analysis container (Default wbtransport/rra-analysis:latest-stable) [ANL_CONTAINER]
  - `analysisProcess.db` - The database connection string. When using Docker for the analysis process, the host will be the name of the database container (`rra-postgis`). When using Hyper, this will be the IP of your hosted database [ANL_DB]
  - `analysisProcess.storageHost` - The host of the storage service. When using Docker, this will be the name of the storage container (`rra-minio`). When using Hyper, this will be the IP of the storage host. [ANL_STORAGE_HOST]
  - `analysisProcess.storagePort` - The port to use. [ANL_STORAGE_PORT]

#### Config Example
```
module.exports = {
  connection: {
    host: '0.0.0.0',
    port: 4000
  },
  db: 'postgresql://rra:rra@localhost:5432/rra',
  osmP2PDir: `${__dirname}/../../osm-p2p-dbs`,
  storage: {
    host: '0.0.0.0',
    port: 9000,
    engine: 'minio',
    accessKey: 'minio',
    secretKey: 'miniostorageengine',
    bucket: 'rra',
    region: 'us-east-1'
  },
  analysisProcess: {
    service: 'docker',
    hyperAccess: null,
    hyperSecret: null,
    container: 'wbtransport/rra-analysis:latest-stable',
    db: 'postgresql://rra:rra@rra-postgis:5432/rra',
    storageHost: 'rra-minio',
    storagePort: 9000
  }
};
```

### Setup
Both the database and the local storage need some setup.

```
yarn run setup -- --db --bucket
```

Will prepare all the needed tables for the database and the bucket for storage. Both the database and the bucket will be removed and created anew. **Data will be lost.**

Other available options:
- `--db` - Sets up the db structure.
- `--bucket` - Sets up the storage bucket.
- `--data` - Sets up database and data fixtures. This also sets up the db and bucket, so it's not needed to be used with the previous commands.

Full setup with fixtures example:
*(The `--` is important and can't be omitted)*
```
yarn run setup -- --data
```

### Docker network
Set up the Docker network by running:

```
docker network create rra
```

This allows containers that are not part of the Docker Compose file to connect to the database and storage more easily. This includes the container that spins up the OSRM analysis.

### Starting the containers

Start the docker containers in the background:
```
docker-compose up -d
```
Stop the docker containers with:
```
docker-compose stop
```

The containers will store the information within themselves. If the container is deleted all the information will be lost.
[Minio](https://minio.io) can be used to store the files locally as an alternative to AWS S3. This is particularly useful for local development. Its interface will be available at `http://localhost:9000`.


### Starting the app
```
yarn run nodemon
```
This will start the app at `http://localhost:4000`.
This command starts the server with `nodemon` which watches files and restarts when there's a change.

```
yarn start
```
Starts the app without file watching

## Deployment to ECS
Travis is set up to deploy the backend to an AWS ECS Cluster whenever a PR is merged into the `develop` or `master` branch of the project. This triggers a deploy of the API, the database, and the Minio bucket.

### Setting up deployment
Follow these steps to set up a deployment to an ECS Cluster:

1. [Create an ECS Cluster](http://docs.aws.amazon.com/AmazonECS/latest/developerguide/create_cluster.html) on AWS  
  - the current setup requires one EC2 instance and has been tested on a `t2.medium`
  - associate a Key Pair to the instance
  - expose the port for the API (default is `4000`). If you're using Minio as the storage engine, also open that port (eg. `9000`).
2. Modify the Travis config with your AWS credentials  
  - `AWS_ECS_CLUSTER` = the cluster you created in step 1
  - `AWS_REGION`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY` - use `travis encrypt AWS_SECRET_ACCESS_KEY=[secretKey]` to [generate an encrypted key](https://docs.travis-ci.com/user/encryption-keys/)
3. SSH into the machine with your Key Pair to set up the basic database structure  
  - run `docker ps` and to find the Container ID of `rra-api`
  - run `docker exec [container_id] npm run setup -- --db --bucket`
4. [to come] deployment of the Analysis process

This should set up the basic cluster that Travis can push the backend to.

#### Disabling a deployment
To disable a particular deployment, you can remove it from the deploy block from `.travis.yml`.

```
deploy:
  - provider: script
    skip_cleanup: true
    script: .build_scripts/deploy.sh
    on:
      branch: ${STABLE_BRANCH}
```
