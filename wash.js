import { client, bucket_prefix, org } from './config.js';
import { Point } from '@influxdata/influxdb-client'
import pMap from 'p-map';
import axios from "axios";

const bucket = bucket_prefix + "wash";

let writeApi;
if (client) {
    writeApi = client.getWriteApi(org, bucket);
    writeApi.useDefaultTags({ host: 'host1' });
}

export async function fetchData() {
    const LaundriesIDList = [
        '26948', '27036', '27037', '27038', '27039', '27040',
        '27041', '27042', '27043', '27044', '27045', '27046',
        '27047', '27048', '27049', '27050', '27051', '27052',
        '27053', '27054', '27055', '27056', '27057', '27058',
        '27059', '27060', '27061', '27062', '27063', '27064',
        '27065', '27066', '27067', '27068', '27069', '27070',
        '27071', '27072', '27073', '27074', '27075', '27076',
        '27077', '27078', '27079', '27080', '27081', '27082',
        '27083', '27084', '27085', '27086', '27087', '27088',
        '27089', '27090', '27091', '27092', '27093', '27094',
        '27095', '27096', '27097', '27098', '27099', '27100',
        '27101', '27102', '27103', '27114', '27115', '27116',
        '27117', '27118', '27119', '27120', '27121', '27122',
        '27123', '27124', '27125', '27126', '27127', '27128',
        '27129', '27130', '27131', '27132', '27133', '27134',
        '27135', '27136', '27137', '27138', '27139', '27140',
        '27141', '27142', '32006', '35552'
    ]

    const laundriesData = await pMap(LaundriesIDList, async (id) => {
        const laundryDetail = await axios.get(`https://yshz-user.haier-ioc.com/position/positionDetail`, {
            params: { id }
        })
        const categoryCodeIDList = laundryDetail.data.data.positionDeviceDetailList.map(e => e.categoryCode);
        const deviceDetail = (await Promise.all(categoryCodeIDList.map(async (categoryCode) => {
            const res = await axios.post("https://yshz-user.haier-ioc.com/position/deviceDetailPage", {
                "positionId": id,
                "categoryCode": categoryCode,
                "page": 1,
                "floorCode": "",
                "pageSize": 10
            }, {
                headers: {
                    "Content-Type": 'application/json'
                },
            })
            const ret = res.data.data.items.map(item => ({
                categoryCode,
                categoryName: laundryDetail.data.data.positionDeviceDetailList.find(e => e.categoryCode === categoryCode)?.categoryName ?? "",
                ...item
            }))
            return ret;
        }))).flat()

        return {
            laundryName: laundryDetail.data.data.name,
            laundrySummary: laundryDetail.data.data.positionDeviceDetailList,
            devices: deviceDetail
        };

    }, { concurrency: 5 });

    await Promise.all(laundriesData.map(async e => {
        if (writeApi) {
            await saveToInflux(e);
        }
    }));

    async function saveToInflux(laundry) {
        laundry.devices.forEach(device => {
            let point = new Point('wash_device')
                .tag("laundry_name", laundry["laundryName"])
                .tag("device_name", device["name"])
                .tag("device_id", device["deviceId"])
                .tag("category_code", device["categoryCode"])
                .tag("category_name", device["categoryName"])
                .tag("floor_code", device["floorCode"])
                .booleanField('free', device["state"] === 1)
                .booleanField('used', device["state"] === 2)
                .stringField('extra', device["finishTime"] ?? "")
            writeApi.writePoint(point)
        });
        laundry.laundrySummary.forEach(summary => {
            let point = new Point('wash_summary')
                .tag("laundry_name", laundry["laundryName"])
                .tag("category_code", summary["categoryCode"])
                .tag("category_name", summary["categoryName"])
                .intField("all", summary.total)
                .intField("idle", summary.idleCount)
            writeApi.writePoint(point)
        });
        await writeApi.flush()
    }
}
