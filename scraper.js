const fs = require('fs');
const { pipeline } = require('stream/promises');

const COOKIE = process.env.OTTC_COOKIE;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

async function updateM3u() {
    console.log("Initiating Heavy-Duty Shadow Protocol...");
    
    try {
        const pageResponse = await fetch('https://freeiptv2023-d.ottc.xyz/index.php?action=view', {
            headers: {
                'Cookie': COOKIE,
                'User-Agent': USER_AGENT,
                'Referer': 'https://freeiptv2023-d.ottc.xyz/index.php'
            }
        });
        
        const html = await pageResponse.text();
        const linkMatch = html.match(/http:\/\/freeiptv\.ottc\.xyz:80\/get\.php\?[^"'\s<>]+/);

        if (linkMatch) {
            let freshUrl = linkMatch[0];
            if (!freshUrl.includes('type=m3u')) {
                freshUrl += "&type=m3u_plus&output=ts";
            }
            
            console.log("Success! Capturing massive stream...");

            const m3uResponse = await fetch(freshUrl, {
                headers: {
                    'Cookie': COOKIE,
                    'User-Agent': USER_AGENT
                }
            });

            // FIXED LINE: No backticks, just standard quotes to avoid syntax errors
            if (!m3uResponse.ok) throw new Error('Server responded with status: ' + m3uResponse.status);

            const writer = fs.createWriteStream('master.m3u');
            
            // This pipes the data directly to the file to handle the huge size
            await pipeline(m3uResponse.body, writer);
            
            const stats = fs.statSync('master.m3u');
            if (stats.size < 500) { // Small size check
                console.error("CRITICAL: File downloaded but it is too small. Check cookie!");
                process.exit(1);
            }

            console.log("WAR WON! Saved " + Math.round(stats.size / 1024) + " KB to master.m3u");
        } else {
            console.error("CRITICAL: Link not found. Cookie expired.");
            process.exit(1);
        }
    } catch (error) {
        console.error("Protocol Error:", error.message);
        process.exit(1);
    }
}

updateM3u();
