const fs = require('fs');
const http = require('http');
const zlib = require('zlib');
const readline = require('readline');

const COOKIE = process.env.OTTC_COOKIE;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

// THE ULTIMATE FILTER: Custom-built for your exact requested groups
const KEYWORDS = [
    // USA
    'USA | ENTERTAINMENT', 'USA | KIDS', 'USA | SPORTS', 'USA | SOCCER', 'USA | MOVIES', 
    'USA | NETFLIX', 'USA | SLINGTV', 'USA | PRIME', 'USA | MAX', 'USA | DISNEY',
    
    // CANADA
    'CAN | ENGLISH', 'CAN | SPORT', 'CAN | KIDS', 'CAN | SOCCER', 'CAN | PRIME',

    // UK (Assuming standard naming format based on USA/CAN)
    'UK | ENTERTAINMENT', 'UK | KIDS', 'UK | SPORT', 'UK | MOVIES', 'UK | SKY', 

    // ASIA / INDIA / LANGUAGES (Includes the exact misspellings from your screenshots!)
    'AS | INDIA', 'AS | TELEGU', 'AS | TELUGU', 'AS | HINDI', 'AS | ENGLISH', 'AS | SPORTS', 'AS | MOVIES',
    '[24/7 O-D] INDIA', '[24/7 O-D] TELEGU', '[24/7 O-D] HINDI',

    // 24/7 BINGE CHANNELS
    '[24/7 O-D] MOVIES', '[24/7 O-D] COMEDY', '[24/7 O-D] ACTION', '[24/7 O-D] KIDS',
    '[24/7 O-D] DISNEY', '[24/7 O-D] PRIME', '[24/7 O-D] NETFLIX', 
    
    // SPECIFIC BRANDS (Will grab anywhere they appear)
    'HOTSTAR', 'NETFLIX', 'SLINGTV', 'PRIME VIDEO', 'DISNEY'
];

async function updateM3u() {
    console.log("Commencing Ultimate Smart Filter Protocol...");
    
    try {
        const pageResponse = await fetch('https://freeiptv2023-d.ottc.xyz/index.php?action=view', {
            headers: { 'Cookie': COOKIE, 'User-Agent': USER_AGENT, 'Referer': 'https://freeiptv2023-d.ottc.xyz/index.php' }
        });
        
        const html = await pageResponse.text();
        const linkMatch = html.match(/http:\/\/freeiptv\.ottc\.xyz:80\/get\.php\?[^"'\s<>]+/);

        if (linkMatch) {
            let freshUrl = linkMatch[0];
            if (!freshUrl.includes('type=m3u')) freshUrl += "&type=m3u_plus&output=ts";
            
            const request = http.get(freshUrl, { headers: { 'Cookie': COOKIE, 'User-Agent': USER_AGENT } }, (res) => {
                const rl = readline.createInterface({ input: res, terminal: false });
                const output = fs.createWriteStream('master.m3u');
                
                let currentInfo = '';
                let shouldKeep = false;
                let count = 0;

                output.write("#EXTM3U\n");

                rl.on('line', (line) => {
                    if (line.startsWith('#EXTINF')) {
                        const upperLine = line.toUpperCase();
                        // Checks if the channel info contains any of our target keywords
                        shouldKeep = KEYWORDS.some(k => upperLine.includes(k));
                        currentInfo = line;
                    } else if (line.startsWith('http') && shouldKeep) {
                        output.write(currentInfo + "\n" + line + "\n");
                        count++;
                        shouldKeep = false;
                    }
                });

                rl.on('close', () => {
                    output.end();
                    const raw = fs.readFileSync('master.m3u');
                    const compressed = zlib.gzipSync(raw);
                    fs.writeFileSync('master.m3u.gz', compressed);
                    console.log(`SUCCESS: Filtered ${count} channels. New size: ${Math.round(compressed.length / 1024)} KB`);
                });
            });
        }
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

updateM3u();

