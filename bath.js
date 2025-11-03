import { client, bucket_prefix, org } from './config.js';
import { Point } from '@influxdata/influxdb-client'
import { axiosWithProxy as axios } from "./utils.js"

const bucket = bucket_prefix + "bath";

let writeApi;
if (client) {
    writeApi = client.getWriteApi(org, bucket);
    writeApi.useDefaultTags({ host: 'host1' });
}

export async function fetchData() {
    const data = (await axios.get('http://wap.xt.beescrm.com/activity/WaterControl/getGroupInfo/version/1')).data.data;

    for (const dormitory of data) {
        if (writeApi) {
            await saveToInfluxdb(dormitory);
        }
    }
    async function saveToInfluxdb(dormitory) {
        const bathPeoplePoint = new Point('bath_people')
            .tag("dormitory_name", dormitory["Name"])
            .intField('free', dormitory["status_count"]["free"])
            .intField('used', dormitory["status_count"]["used"])
            .intField('error', dormitory["status_count"]["error"]);
        writeApi.writePoint(bathPeoplePoint);
        await writeApi.flush();
    }
}