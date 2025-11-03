import { fetchData as fetchDataBath } from './bath.js';
import { fetchData as fetchDataStudy } from './study.js';
import { fetchData as fetchDataCharge } from './charge.js';
import { fetchData as fetchDataWash } from './wash.js';

(async () => { try { await fetchDataBath() } catch (error) { } })();
(async () => { try { await fetchDataStudy() } catch (error) { } })();
(async () => { try { await fetchDataCharge() } catch (error) { } })();
(async () => { try { await fetchDataWash() } catch (error) { } })();

setInterval(async () => { try { await fetchDataBath() } catch (error) { } }, 15000);
setInterval(async () => { try { await fetchDataStudy() } catch (error) { } }, 15000);
setInterval(async () => { try { await fetchDataCharge() } catch (error) { } }, 5000);
setInterval(async () => { try { await fetchDataWash() } catch (error) { } }, 15000);