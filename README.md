# Influx Everything

## Deployment

1. Create three buckets with a common prefix of your choosing, followed respectively by `bath`, `charge` and `study` in your InfluxDB instance.
2. Create an `.env` under the project's directory, and fill it in according to `.env.example`.
3. Run with `node --env-file .env index.js`, or build with `docker build .`.

## Note

For `charge.js`: The script will try accessing the API endpoint, then obtain authorization if the request failed. A request error will always occur on its first attempt during each startup, which can be safely ignored if such doesn't happen again.