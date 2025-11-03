import { client, bucket_prefix, org } from './config.js';
import { Point } from '@influxdata/influxdb-client'
import { axiosWithProxy as axios } from "./utils.js"

const bucket = bucket_prefix + "study";

let writeApi;
if (client) {
    writeApi = client.getWriteApi(org, bucket);
    writeApi.useDefaultTags({ host: 'host1' });
}

export async function fetchData() {

    const rooms = await axios.post('https://ids.sjtu.edu.cn/classRoom/getByFreeClassroomInfo', `roomCode=LGXQ`, { headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' } })
        .then(function (response) {
            return JSON.parse(response.data.data.freeClassRoomList)
        });
    for (const room of rooms) {
        if (writeApi) {
            saveToInfluxdb(room);
        }
    }

    async function saveToInfluxdb(room) {
        const roomPoint = new Point('study_room')
            .tag("room_name", room["name"])
            .tag("building_name", room["buildName"])
            .intField("used", room["realTimeNum"])
            .intField("all", Number(room["kwNum"]));
        writeApi.writePoint(roomPoint);
        await writeApi.flush()
    }
}
