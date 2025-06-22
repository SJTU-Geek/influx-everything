//Modified from https://github.com/3846masa/axios-cookiejar-support/issues/669#issuecomment-1382895201
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http';
import { URL } from 'url';

const proxyUrl = process.env.https_proxy || process.env.http_proxy;
let proxy;
if (proxyUrl) {
    const parsed = new URL(proxyUrl);
    proxy = {
        protocol: parsed.protocol.replace(':', ''),
        host: parsed.hostname,
        port: parseInt(parsed.port, 10)
    };
}

export const jar = new CookieJar();

function wrapAgent(Agent) {
    const kProxy = Symbol('cookieOptions')
    class WrappedAgent extends Agent {
        constructor(options, ...rest) {
            super(options, ...rest)
            if (options && options.cookies)
                this[kProxy] = options.cookies.proxy
        }
        addRequest(req, options) {
            const protocol = req.protocol
            const host = req.host
            const path = req.path
            if (this[kProxy]) {
                const parsed = URL.parse(req.path)
                req.protocol = parsed.protocol
                req.host = parsed.host
                req.path = parsed.pathname + (parsed.search ? parsed.search : '')
            }
            const result = super.addRequest(req, options)
            if (this[kProxy]) {
                req.protocol = protocol
                req.host = host
                req.path = path
            }
            return result
        }
    }
    return WrappedAgent
}

const httpAgent = new (wrapAgent(HttpCookieAgent))({ cookies: { jar: jar, proxy: proxy } })
const httpsAgent = new (wrapAgent(HttpsCookieAgent))({ cookies: { jar: jar, proxy: proxy } })

export const axiosWithProxy = axios.create({
    proxy,
    httpAgent,
    httpsAgent
});