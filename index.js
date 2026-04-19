import { setupWhatsApp } from './lib/whatsapp.js';
import { handleIncomingMessage } from './lib/handler.js';
import { initConfigService } from './services/configService.js';
import { delay } from './lib/utils.js';
import pino from 'pino';

const logger = pino({ level: 'info' });

(async () => {
    logger.info('🚀 Memulai bot INDOMARET GROGOL...');
    
    // Inisialisasi config service (fetch online + fallback)
    await initConfigService();
    
    // Mulai koneksi WhatsApp
    const sock = await setupWhatsApp();
    
    // Event handler untuk pesan masuk
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        await handleIncomingMessage(sock, msg);
    });
    
    // Auto-reconnect sudah ditangani oleh Baileys, tapi tambahkan log
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            logger.warn('🔌 Koneksi terputus, mencoba reconnect...');
            if (shouldReconnect) {
                setupWhatsApp().catch(err => logger.error('Reconnect gagal:', err));
            }
        } else if (connection === 'open') {
            logger.info('✅ Bot online dan siap melayani!');
        }
    });
    
    // Jaga proses tetap hidup
    process.on('unhandledRejection', (err) => logger.error('Unhandled Rejection:', err));
})();
