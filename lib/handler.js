import { generateMenuText } from './menu.js';
import { normalizeText, delay } from './utils.js';
import { getConfig } from '../services/configService.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

const aliasMap = {
    '1': '1', 'paling murah': '1', 'murah': '1',
    '2': '2', 'tebus heboh': '2', 'tebus': '2', 'heboh': '2',
    '3': '3', 'beli banyak': '3', 'banyak': '3',
    '4': '4', 'promo minggu ini': '4', 'minggu': '4', 'promo': '4'
};

export async function handleIncomingMessage(sock, msg) {
    const jid = msg.key.remoteJid;
    const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const normalized = normalizeText(messageText);
    
    // Abaikan pesan kosong
    if (!normalized) {
        await sock.sendMessage(jid, { text: 'Silakan ketik menu atau pilih kategori promo.' });
        return;
    }
    
    const config = getConfig();
    const brand = config.brand;
    
    // Cek apakah user ingin melihat menu (kata kunci: menu, halo, hi, dll)
    if (['menu', 'halo', 'hai', 'hi', 'hello', 'start'].includes(normalized)) {
        const menuText = generateMenuText(config);
        await sock.sendMessage(jid, { text: menuText });
        return;
    }
    
    // Cek apakah input cocok dengan alias
    const categoryKey = aliasMap[normalized];
    if (categoryKey && config.promos[categoryKey]) {
        const promo = config.promos[categoryKey];
        try {
            // Kirim gambar dari URL CDN
            await sock.sendMessage(jid, {
                image: { url: promo.image },
                caption: `*${promo.title}*\n\n${promo.caption}`
            });
            await delay(1000); // Jeda sebelum kirim menu lagi
            const menuText = generateMenuText(config);
            await sock.sendMessage(jid, { text: menuText });
        } catch (error) {
            logger.error('Gagal mengirim gambar:', error);
            await sock.sendMessage(jid, { text: '❌ Maaf, gambar promo tidak dapat dimuat. Silakan coba lagi nanti.' });
        }
        return;
    }
    
    // Jika tidak dikenali, tampilkan menu default
    const menuText = generateMenuText(config);
    await sock.sendMessage(jid, { text: menuText });
}
