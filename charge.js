import { client, bucket_prefix, org } from './config.js';
import { Point } from '@influxdata/influxdb-client'
import { axiosWithProxy as axios, jar } from "./utils.js"

jar.setCookie(`JAAuthCookie=${process.env.JAAuthCookie}`, "https://jaccount.sjtu.edu.cn")

const bucket = bucket_prefix + "charge";

const writeApi = client.getWriteApi(org, bucket)
writeApi.useDefaultTags({ host: 'host1' })

export async function fetchData() {
    function getEquipmentData() {
        return axios.get('https://e-mobile.sjtu.edu.cn/electromobile/website/list?longitude=0&latitude=0&instance=&power=&fees=&deviceStatus=&websiteName=&websiteId=&portStatus=&limit=100&page=1', {
            timeout: 10000
        });
    }

    const equipmentsData = await new Promise((resolve) => {
        getEquipmentData().then(resolve, async (err) => {
            if (err.status === 401) {
                await axios.get('https://e-mobile.sjtu.edu.cn')
                resolve(getEquipmentData())
            }
        })
    })

    const equipments = equipmentsData.data.data.map((e) => ({ name: e.website_name, ports: e.port_list, ...e }))

    await Promise.all(equipments.map(async e => await saveToInflux(e, new Date(Number(equipmentsData.data.timestamp)))));

    async function saveToInflux(equipment, time) {
        equipment.ports.forEach(port => {
            let point = new Point('mobile_charge')
                .tag("device_name", equipment["name"])
                .tag("device_port", port["device_port"])
                .tag("port_id", port["port_id"])
                .booleanField('free', port["device_status"] === "free")
                .booleanField('error', port["device_status"] === "error")
                .timestamp(time);
            writeApi.writePoint(point)
        });
        let devicePoint = new Point('mobile_charge')
            .tag("device_name", equipment["name"])
            .intField("all", equipment.count)
            .intField("idle", equipment.idle)
            .intField("damage", equipment.damage);
        writeApi.writePoint(devicePoint)
        await writeApi.flush()
    }
}
