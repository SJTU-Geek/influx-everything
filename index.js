import { fetchData as fetchDataBath } from './bath.js';
import { fetchData as fetchDataStudy } from './study.js';
import { fetchData as fetchDataCharge } from './charge.js';
import { fetchData as fetchDataWash } from './wash.js';

fetchDataBath().then()
fetchDataStudy().then()
fetchDataCharge().then()
fetchDataWash().then()

setInterval(fetchDataBath, 15000);
setInterval(fetchDataStudy, 15000);
setInterval(fetchDataCharge, 5000);
setInterval(fetchDataWash, 15000);