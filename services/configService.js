import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const logger = pino({ level: 'info' });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_URL = 'https://raw.githubusercontent.com/USERNAME/indomaret-grogol-assets/main/config.json';
const LOCAL_CONFIG_PATH = path.join(__dirname, '..', 'config.local.json');
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 menit

let cachedConfig = null;

export async function initConfigService() {
    await refreshConfig();
    // Auto refresh setiap 5-10 menit
    setInterval(refreshConfig, REFRESH_INTERVAL);
    logger.info('🔄 Config service siap, refresh setiap 5 menit');
}

async function refreshConfig() {
    try {
        const response = await fetch(CONFIG_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const remoteConfig = await response.json();
        cachedConfig = remoteConfig;
        logger.info('✅ Config online berhasil dimuat');
    } catch (error) {
        logger.warn('⚠️ Gagal fetch config online, menggunakan fallback lokal');
        try {
            const localData = await fs.readFile(LOCAL_CONFIG_PATH, 'utf-8');
            cachedConfig = JSON.parse(localData);
            logger.info('📁 Config lokal dimuat');
        } catch (localError) {
            logger.error('❌ Config lokal juga gagal! Bot tidak dapat berjalan.');
            // Fallback hardcoded minimal
            cachedConfig = createMinimalConfig();
        }
    }
}

export function getConfig() {
    if (!cachedConfig) {
        // Jika belum ada, coba muat lokal sinkron (hanya untuk situasi darurat)
        try {
            const localData = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8');
            cachedConfig = JSON.parse(localData);
        } catch {
            cachedConfig = createMinimalConfig();
        }
    }
    return cachedConfig;
}

function createMinimalConfig() {
    return {
        brand: 'INDOMARET GROGOL',
        menu: {
            title: 'MENU PROMO',
            text: 'Silakan pilih promo:',
            footer: 'Ketik angka atau nama kategori'
        },
        promos: {
            '1': {
                title: 'Paling Murah',
                image: 'https://cdn.jsdelivr.net/gh/USERNAME/indomaret-grogol-assets/promo/01-paling-murah.jpg',
                caption: 'Promo paling murah minggu ini!'
            },
            '2': {
                title: 'Tebus Heboh',
                image: 'https://cdn.jsdelivr.net/gh/USERNAME/indomaret-grogol-assets/promo/02-tebus-heboh.jpg',
                caption: 'Tebus hemat sekarang!'
            },
            '3': {
                title: 'Beli Banyak',
                image: 'https://cdn.jsdelivr.net/gh/USERNAME/indomaret-grogol-assets/promo/03-beli-banyak.jpg',
                caption: 'Semakin banyak semakin hemat!'
            },
            '4': {
                title: 'Promo Minggu Ini',
                image: 'https://cdn.jsdelivr.net/gh/USERNAME/indomaret-grogol-assets/promo/04-promo-minggu-ini.jpg',
                caption: 'Promo terbaru minggu ini!'
            }
        }
    };
}
