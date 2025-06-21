# Influx Everything

## Deployment

1. Create three buckets with a common prefix of your choosing, followed respectively by `bath`, `charge` and `study` in your InfluxDB instance.
2. Create an `.env` under the project's directory, and fill it in according to `.env.example`.
3. Run with `node --env-file .env index.js`, or build with `docker build .`.