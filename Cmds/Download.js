const axios = require('axios');
const { keith } = require('../commandHandler');
const vm = require('vm');
const sharp = require('sharp');
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================
//========================================================================================================================



const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0";
const site = "https://igram.world";
const hub = "https://api-wh.igram.world";
const ocrKeys = ["helloworld", "K81634588988957", "K87899142388957"];
const headers = { "user-agent": ua, origin: site, referer: site + "/" };

async function getChunk() {
    const home = await (await fetch(site + "/en1/", { headers: { ...headers, accept: "text/html" } })).text();
    const appPath = (home.match(/\/js\/app\.js\?id=[a-f0-9]+/) || ["/js/app.js"])[0];
    const app = await (await fetch(site + appPath, { headers: { ...headers, accept: "*/*" } })).text();
    const chunk = (app.match(/js\/link\.chunk\.js\?ch=[0-9a-f]+\.js/) || ["js/link.chunk.js"])[0];
    return await (await fetch(site + "/" + chunk, { headers: { ...headers, accept: "*/*" } })).text();
}

function createSigner(code) {
    const nodeCrypto = require("crypto");
    const reals = {};
    for (const k of ["Object", "Array", "Function", "Boolean", "Number", "String", "Symbol", "Math", "JSON", "Date", "RegExp", "Error", "TypeError", "RangeError", "SyntaxError", "Promise", "parseInt", "parseFloat", "isNaN", "isFinite", "encodeURIComponent", "decodeURIComponent", "encodeURI", "decodeURI", "Map", "Set", "WeakMap", "WeakSet", "ArrayBuffer", "Uint8Array", "Uint16Array", "Uint32Array", "Int8Array", "Int16Array", "Int32Array", "Float32Array", "Float64Array", "DataView", "TextEncoder", "TextDecoder", "Reflect", "Proxy", "BigInt", "escape", "unescape", "Intl"]) reals[k] = global[k];
    reals.crypto = global.crypto || nodeCrypto.webcrypto;
    reals.console = { log() {}, warn() {}, error() {}, info() {}, debug() {} };
    reals.performance = global.performance;
    reals.atob = global.atob;
    reals.btoa = global.btoa;
    reals.setTimeout = () => 0; reals.clearTimeout = () => {}; reals.setInterval = () => 0; reals.clearInterval = () => {};
    reals.requestIdleCallback = () => 0; reals.cancelIdleCallback = () => {}; reals.requestAnimationFrame = () => 0; reals.cancelAnimationFrame = () => {};
    reals.queueMicrotask = f => Promise.resolve().then(f);
    reals.URL = global.URL; reals.URLSearchParams = global.URLSearchParams; reals.Blob = global.Blob; reals.fetch = global.fetch;
    reals.AbortController = global.AbortController; reals.AbortSignal = global.AbortSignal;
    reals.Event = global.Event || function () {}; reals.CustomEvent = global.CustomEvent || function () {}; reals.EventTarget = global.EventTarget || function () {};
    reals.MessageChannel = global.MessageChannel || function () { this.port1 = {}; this.port2 = {} };
    reals.structuredClone = global.structuredClone;
    const storage = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear(), key: i => [...m.keys()][i] ?? null, get length() { return m.size } } };
    reals.localStorage = storage(); reals.sessionStorage = storage();
    reals.navigator = { userAgent: ua, language: "en-US", languages: ["en-US", "en"], platform: "Win32", hardwareConcurrency: 8, deviceMemory: 8, webdriver: false, vendor: "Google Inc.", plugins: { length: 0 }, maxTouchPoints: 0 };
    reals.location = { href: site + "/en1/", origin: site, protocol: "https:", host: "igram.world", hostname: "igram.world", pathname: "/en1/", search: "", hash: "", reload() {}, replace() {}, assign() {}, toString() { return this.href } };
    const el = (tag = "DIV") => ({ tagName: tag, nodeName: tag, nodeType: 1, ownerDocument: null, [Symbol.toStringTag]: "HTML" + tag[0] + tag.slice(1).toLowerCase() + "Element", setAttribute() {}, getAttribute() { return null }, hasAttribute() { return false }, appendChild(x) { return x }, removeChild(x) { return x }, insertBefore(x) { return x }, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true }, style: {}, dataset: {}, classList: { add() {}, remove() {}, contains() { return false }, toggle() {} }, getContext() { return null }, remove() {}, cloneNode() { return el(tag) }, set src(v) {}, get src() { return "" }, set onload(v) {}, set onerror(v) {}, set innerHTML(v) {}, get innerHTML() { return "" }, children: [], childNodes: [] });
    reals.document = { [Symbol.toStringTag]: "HTMLDocument", nodeType: 9, nodeName: "#document", createElement: t => el((t || "div").toUpperCase()), createElementNS: (ns, t) => el((t || "div").toUpperCase()), createTextNode: t => ({ nodeType: 3, textContent: t }), createComment: () => ({ nodeType: 8 }), createDocumentFragment: () => el("FRAGMENT"), getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], getElementsByTagName: () => [], getElementsByClassName: () => [], addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true }, head: el("HEAD"), body: el("BODY"), documentElement: el("HTML"), cookie: "", currentScript: null, readyState: "complete", visibilityState: "visible", hidden: false, referrer: "", title: "igram", characterSet: "UTF-8", contentType: "text/html", compatMode: "CSS1Compat", hasFocus: () => true };
    reals.screen = { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, colorDepth: 24, pixelDepth: 24 };
    reals.history = { pushState() {}, replaceState() {}, length: 1, state: null };
    reals.addEventListener = () => {}; reals.removeEventListener = () => {}; reals.dispatchEvent = () => true;
    reals.matchMedia = () => ({ matches: false, media: "", addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    reals.getComputedStyle = () => ({ getPropertyValue: () => "" });
    reals.XMLHttpRequest = function () { this.open = () => {}; this.send = () => {}; this.setRequestHeader = () => {}; this.addEventListener = () => {} };
    reals.WebSocket = function () { this.close = () => {}; this.send = () => {}; this.addEventListener = () => {} };
    reals.Worker = function () { this.postMessage = () => {}; this.terminate = () => {}; this.addEventListener = () => {} };
    reals.Image = function () {}; reals.CSS = { supports: () => false };

    let captured = [];
    const handler = {
        get(t, p, r) { if (p in t) return t[p]; if (["self", "window", "globalThis", "global", "top", "parent", "frames"].includes(p)) return r; return undefined },
        set(t, p, v) { t[p] = v; if (Array.isArray(v)) captured.push(v); return true }
    };
    const ctx = new Proxy(reals, handler);
    reals.self = ctx; reals.window = ctx; reals.globalThis = ctx; reals.global = ctx; reals.top = ctx; reals.parent = ctx; reals.frames = ctx;
    reals.document.defaultView = ctx; reals.document.location = reals.location;

    vm.createContext(ctx);
    vm.runInContext(code, ctx, { filename: "link.chunk.js" });

    let modules = null;
    for (const arr of captured) for (const e of arr) if (Array.isArray(e) && Array.isArray(e[0]) && e[1] && typeof e[1] === "object") modules = e[1];
    if (!modules || !modules[3508]) throw new Error("signer module not found");

    const cache = {};
    function req(id) {
        if (cache[id]) return cache[id].exports;
        const m = cache[id] = { exports: {} };
        try { modules[id].call(ctx, m, m.exports, req); } catch {}
        return m.exports;
    }
    req.d = (e, defs) => { for (const k in defs) if (Object.prototype.hasOwnProperty.call(defs, k) && !Object.prototype.hasOwnProperty.call(e, k)) Object.defineProperty(e, k, { enumerable: true, get: defs[k] }) };
    req.o = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
    req.r = e => { try { Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }) } catch {} Object.defineProperty(e, "__esModule", { value: true }) };
    req.n = m => { const g = m && m.__esModule ? () => m.default : () => m; req.d(g, { a: g }); return g };
    req.e = () => Promise.resolve(); req.g = ctx; req.p = site + "/"; req.b = req.p; req.u = () => ""; req.f = {}; req.m = modules; req.c = cache; req.x = () => {}; req.h = () => "";

    req(2871).evaluateEnvironment = () => ({ hardFail: false, hardReasons: [], score: 0, flags: 0, signals: {} });
    req(9267).checkDomainAdvanced = () => ({ ok: true, hardFail: false, hardReason: "", score: 0, flags: 0, signals: {}, host: "igram.world" });
    req(9267).isProbablyNative = () => true;

    const pending = req(3508).default;
    let fn = null;
    return async body => { if (!fn) fn = await pending; return await fn(body) };
}

async function ocr(png) {
    for (const key of ocrKeys) {
        const form = new FormData();
        form.append("file", new Blob([png], { type: "image/png" }), "c.png");
        form.append("language", "eng"); form.append("OCREngine", "2"); form.append("scale", "true"); form.append("isOverlayRequired", "false");
        try {
            const res = await fetch("https://api.ocr.space/parse/image", { method: "POST", headers: { apikey: key }, body: form });
            const j = await res.json().catch(() => null);
            if (j && !j.IsErroredOnProcessing && Array.isArray(j.ParsedResults)) return j.ParsedResults.map(r => r.ParsedText || "").join("").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
            if (!/rate|limit|exceed|quota/i.test(JSON.stringify(j))) break;
        } catch {}
    }
    return "";
}

async function solveCaptcha() {
    const j = await (await fetch(hub + "/api/captcha", { headers: { ...headers, accept: "application/json, text/plain, */*" } })).json();
    if (!j || !j.captcha || !j.hash) return null;
    const svgRes = await fetch(hub + "/captcha?captcha=" + encodeURIComponent(j.captcha), { headers: { ...headers, accept: "image/*" } });
    const svg = Buffer.from(await svgRes.arrayBuffer());
    const png = await sharp(svg, { density: 220 }).flatten({ background: "#ffffff" }).resize(360, 120).png().toBuffer();
    const text = await ocr(png);
    if (text.length < 3) return null;
    const body = new URLSearchParams({ value: text, hash: j.hash });
    const r = await fetch(hub + "/api/captcha", { method: "POST", headers: { ...headers, "content-type": "application/x-www-form-urlencoded", accept: "application/json, text/plain, */*" }, body });
    const s = await r.json().catch(() => ({}));
    return s && s.result ? s.result : null;
}

async function rawPost(url, body, token) {
    const h = { ...headers, "content-type": "application/json", accept: "application/json, text/plain, */*" };
    if (token) h["x-token"] = token;
    const r = await fetch(url, { method: "POST", headers: h, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { status: r.status, data: j, captcha: j && j.code === "CAPTCHA_REQUIRED" };
}

async function signedRequest(signer, url, rawBody) {
    let body = await signer(rawBody);
    let res = await rawPost(url, body);
    let attempts = 0;
    while (res.captcha && attempts < 8) {
        attempts++;
        const token = await solveCaptcha();
        if (!token) continue;
        body = await signer(rawBody);
        res = await rawPost(url, body, token);
    }
    return { ...res, attempts };
}

function parseStories(data) {
    const arr = Array.isArray(data && data.result) ? data.result : Array.isArray(data) ? data : [];
    const out = [];
    for (const it of arr) {
        if (!it) continue;
        const vids = it.video_versions || it.video_resources || [];
        if (Array.isArray(vids) && vids.length) {
            const v = vids[0];
            out.push({ type: "video", url: v.url_wrapped || v.url });
        } else {
            const cands = (it.image_versions2 && it.image_versions2.candidates) || it.display_resources || [];
            const c = cands[0];
            if (c) out.push({ type: "image", url: c.url_wrapped || c.url || c.src });
        }
    }
    return out;
}

function detect(input) {
    const s = String(input).trim();
    if (!/^https?:\/\//i.test(s)) return { username: s.replace(/^@/, "").replace(/\/+$/, "") };
    let path = s;
    try { path = new URL(s).pathname; } catch {}
    const story = path.match(/\/stories\/([^/]+)(?:\/(\d+))?/);
    if (story) return { username: story[1] };
    const prof = path.match(/^\/([^/]+)\/?$/);
    if (prof && !["explore", "p", "reel", "reels", "tv", "stories"].includes(prof[1])) return { username: prof[1] };
    return { username: s };
}

async function getStories(username) {
    const signer = createSigner(await getChunk());
    const r = await signedRequest(signer, hub + "/api/v1/instagram/stories", { username: username });
    if (r.captcha) return { status: false, error: "captcha unsolved after " + r.attempts + " attempts" };
    if (r.status !== 200 || (r.data && r.data.success === false)) return { status: false, error: (r.data && (r.data.message || r.data.info)) || ("http " + r.status) };
    return { status: true, media: parseStories(r.data) };
}
//========================================================================================================================
//========================================================================================================================


keith({
    pattern: "igstory",
    aliases: ["igstories", "stories", "story"],
    category: "Downloader",
    description: "Download Instagram stories as album"
}, async (from, client, conText) => {
    const { q, reply, mek, isSuperUser } = conText;

    if (!isSuperUser) return reply("❌ Owner only!");

    if (!q) {
        return reply(`📌 *Instagram Stories Downloader*
        
Download all available stories as an album.

*Usage:*
.igstory username
.igstories cristiano

*Examples:*
.igstory cristiano
.igstories kyliejenner`);
    }

    const username = q.replace(/^@/, "").replace(/\/+$/, "");
    const urlPattern = /^https?:\/\//i.test(username) ? username : null;
    const target = urlPattern ? detect(urlPattern).username : username;

    try {
        const result = await getStories(target);
        if (!result.status) return reply(`❌ Error: ${result.error}`);

        const media = result.media;
        if (!media.length) return reply(`❌ No stories found for @${target}.`);

        // Send ALL stories in chunks (max 10 per album)
        const chunkSize = 10;
        let totalSent = 0;

        for (let chunk = 0; chunk < media.length; chunk += chunkSize) {
            const chunkMedia = media.slice(chunk, chunk + chunkSize);
            const album = [];

            for (let i = 0; i < chunkMedia.length; i++) {
                const item = chunkMedia[i];
                const isFirstInAlbum = i === 0 && chunk === 0;
                
                if (item.type === "video") {
                    album.push({ 
                        video: { url: item.url },
                        caption: isFirstInAlbum ? `📸 *Stories from @${target}*\n📊 Total: ${media.length} story(ies)` : undefined
                    });
                } else {
                    album.push({ 
                        image: { url: item.url },
                        caption: isFirstInAlbum ? `📸 *Stories from @${target}*\n📊 Total: ${media.length} story(ies)` : undefined
                    });
                }
            }

            await client.sendMessage(from, { album }, { quoted: mek });
            totalSent += chunkMedia.length;
            
            // Small delay between albums to avoid rate limiting
            if (chunk + chunkSize < media.length) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

     //   await reply(`✅ Sent ${totalSent} stories from @${target} as album(s)!`);

    } catch (err) {
        console.error("igstory error:", err);
        await reply(`❌ Error: ${err.message}`);
    }
});      
//========================================================================================================================
// From Download.js

keith({
  pattern: "play",
  aliases: ["ytmp3", "ytmp3doc", "audiodoc", "yta", "song"],
  category: "Downloader",
  description: "Download Video from Youtube"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q) return;

  try {
    let videoUrl;
    let videoTitle;

    if (q.match(/(youtube\.com|youtu\.be)/i)) {
      videoUrl = q;
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
      if (!videoId) return;
      videoTitle = "YouTube Audio";
    } else {
      const searchResponse = await axios.get(`${api}/search/yts?query=${encodeURIComponent(q)}`);
      const videos = searchResponse.data?.result;
      if (!Array.isArray(videos) || videos.length === 0) return;

      const firstVideo = videos[0];
      videoUrl = firstVideo.url;
      videoTitle = firstVideo.title;
    }

    const downloadResponse = await axios.get(`${api}/download/audio?url=${encodeURIComponent(videoUrl)}`);
    const downloadUrl = downloadResponse.data?.result;
    if (!downloadUrl) return;

    const fileName = `${videoTitle}.mp3`.replace(/[^\w\s.-]/gi, '');

    await client.sendMessage(from, {
      audio: { url: downloadUrl },
      mimetype: "audio/mpeg",
      fileName
    }, { quoted: mek });

    await client.sendMessage(from, {
      document: { url: downloadUrl },
      mimetype: "audio/mpeg",
      fileName
    }, { quoted: mek });

  } catch (error) {
    console.error("Error during download process:", error);
  }
});
//========================================================================================================================
// From Download.js

keith({
  pattern: "video",
  aliases: ["ytmp4", "ytmp4doc", "videodoc", "ytv"],
  category: "Downloader",
  description: "Download Video from Youtube"
},
async (from, client, conText) => {
  const { q, mek, api } = conText;

  if (!q) return;

  try {
    let videoUrl;
    let videoTitle;

    if (q.match(/(youtube\.com|youtu\.be)/i)) {
      videoUrl = q;
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
      if (!videoId) return;
      videoTitle = "YouTube Video";
    } else {
      const searchResponse = await axios.get(`${api}/search/yts?query=${encodeURIComponent(q)}`);
      const videos = searchResponse.data?.result;
      if (!Array.isArray(videos) || videos.length === 0) return;

      const firstVideo = videos[0];
      videoUrl = firstVideo.url;
      videoTitle = firstVideo.title;
    }

    const downloadResponse = await axios.get(`${api}/download/video?url=${encodeURIComponent(videoUrl)}`);
    const downloadUrl = downloadResponse.data?.result;
    if (!downloadUrl) return;

    const fileName = `${videoTitle}.mp4`.replace(/[^\w\s.-]/gi, '');

    await client.sendMessage(from, {
      video: { url: downloadUrl },
      mimetype: "video/mp4",
      fileName
    }, { quoted: mek });

    await client.sendMessage(from, {
      document: { url: downloadUrl },
      mimetype: "video/mp4",
      fileName
    }, { quoted: mek });

  } catch (error) {
    console.error("Error during download process:", error);
  }
});
