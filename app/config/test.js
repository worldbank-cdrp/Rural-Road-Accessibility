module.exports = {
  environment: 'local',
  connection: {
    host: '0.0.0.0',
    port: 4000
  },
  db: 'postgresql://rratest:rratest@localhost:5432/rratest',
  osmP2PDir: `${__dirname}/../../osm-p2p-dbs`,
  storage: {
    host: '0.0.0.0',
    port: 9000,
    engine: 'minio',
    accessKey: 'minio',
    secretKey: 'miniostorageengine',
    bucket: 'rra-test',
    region: 'us-east-1'
  },
  analysisProcess: {
    service: null,
    hyperAccess: null,
    hyperSecret: null,
    container: null,
    db: null,
    storageHost: null,
    storagePort: null
  }
};
