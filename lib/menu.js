export function generateMenuText(config) {
    const { brand, menu } = config;
    let text = `*${brand}*\n`;
    text += `━━━━━━━━━━━━━━━━\n`;
    text += `*${menu.title}*\n`;
    text += `${menu.text}\n\n`;
    
    const promos = config.promos;
    for (const key in promos) {
        text += `${key}. ${promos[key].title}\n`;
    }
    
    text += `\n${menu.footer}`;
    return text;
}
