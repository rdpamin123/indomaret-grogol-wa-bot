import makeWASocket, { useMultiFileAuthState, makePairingCodeRequest } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';

const logger = pino({ level: 'info' });
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const question = (query) => new Promise(resolve => rl.question(query, resolve));

export async function setupWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Tawarkan metode login
    console.log('\n🔐 Pilih metode login:');
    console.log('1. Scan QR Code (default)');
    console.log('2. Pairing Code (nomor HP)\n');
    const choice = await question('Masukkan pilihan (1/2): ');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: choice.trim() !== '2',
        logger,
        browser: ['INDOMARET GROGOL BOT', 'Chrome', '1.0.0']
    });
    
    if (choice.trim() === '2') {
        const phoneNumber = await question('📱 Masukkan nomor HP (contoh: 628123456789): ');
        const code = await makePairingCodeRequest(sock, phoneNumber);
        console.log(`\n🔑 Pairing code Anda: ${code}`);
        console.log('➡️ Buka WhatsApp > Perangkat Tertaut > Tautkan dengan nomor telepon');
        console.log('Masukkan kode tersebut dalam waktu 60 detik.\n');
    }
    
    sock.ev.on('creds.update', saveCreds);
    
    // Tunggu koneksi terbuka sebelum return
    await new Promise((resolve, reject) => {
        const handler = ({ connection }) => {
            if (connection === 'open') {
                sock.ev.off('connection.update', handler);
                resolve();
            } else if (connection === 'close') {
                reject(new Error('Koneksi ditutup sebelum terbuka'));
            }
        };
        sock.ev.on('connection.update', handler);
    });
    
    return sock;
}
