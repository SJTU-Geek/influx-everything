import { client, bucket_prefix, org } from './config.js';
import { Point } from '@influxdata/influxdb-client'
import axios from "axios";

const bucket = bucket_prefix + "wash";

const writeApi = client.getWriteApi(org, bucket)
writeApi.useDefaultTags({ host: 'host1' })

export async function fetchData() {
    const LaundriesIDList = [
        "27044",
        "27045"
    ]
    const CategoryCodeIDList = [
        "00",
        "01",
        "02"
    ]

    const laundriesData = await Promise.all(
        LaundriesIDList.map(async (id) => {
            const laundryDetail = await axios.get(`https://yshz-user.haier-ioc.com/position/positionDetail`, {
                params: { id }
            })
            const deviceDetail = (await Promise.all(CategoryCodeIDList.map(async (categoryCode) => {
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

        }))

    await Promise.all(laundriesData.map(async e => await saveToInflux(e, new Date())));

    async function saveToInflux(laundry, time) {
        laundry.devices.forEach(device => {
            let point = new Point('wash_device')
                .tag("laundry_name", laundry["laundryName"])
                .tag("device_name", device["name"])
                .tag("device_id", device["deviceId"])
                .tag("category_code", device["categoryCode"])
                .tag("category_name", device["categoryName"])
                .tag("floor_code", device["floorCode"])
                .booleanField('free', device["state"] === 1)
                .booleanField('error', device["state"] === 2)
                .stringField('extra', device["finishTime"] ?? "")
                .timestamp(time);
            writeApi.writePoint(point)
        });
        laundry.laundrySummary.forEach(summary => {
            let point = new Point('wash_summary')
                .tag("laundry_name", laundry["laundryName"])
                .tag("category_code", summary["categoryCode"])
                .tag("category_name", summary["categoryName"])
                .intField("all", summary.total)
                .intField("idle", summary.idleCount)
                .timestamp(time);
            writeApi.writePoint(point)
        });
        await writeApi.flush()
    }
}
