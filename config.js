import { InfluxDB } from '@influxdata/influxdb-client'

export const token = process.env.INFLUX_TOKEN
export const org = process.env.INFLUX_ORG
export const bucket_prefix = process.env.INFLUX_BUCKET_PREFIX

let dummyClient;
if (process.env.DISABLE_INFLUX !== 'true') {
    dummyClient = new InfluxDB({ url: process.env.INFLUX_URL, token: token });
}
export const client = dummyClient;
