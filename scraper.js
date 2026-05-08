const fs = require('fs');
const http = require('http');
const readline = require('readline');

const COOKIE = process.env.OTTC_COOKIE;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

const KEYWORDS = [
    'HINDI|', 'ENGLISH', 
    'AS | INDIA', 'AS | TELEGU', 'AS | TELUGU', 'AS | HINDI', 
    'AS | ENGLISH', 'AS | SPORTS', 'AS | MOVIES', 'AS |',
    '[24/7 O-D] INDIA', '[24/7 O-D] TELEGU', '[24/7 O-D] HINDI',
    '[24/7 O-D] MOVIES', '[24/7 O-D] COMEDY', '[24/7 O-D] ACTION', '[24/7 O-D] KIDS',
    'TELUGU|HUNGAMA [1080p]', 'TELUGU',
    '[24/7 O-D] NETFLIX',
    'HOTSTAR', 'NETFLIX', 'SLINGTV',
    'PRIME VIDEO', 'DISNEY',
    'Willow', 'Cricket'
];

async function updateM3u() {
    console.log("Commencing Final Clean Filter Protocol...");
    
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
                        shouldKeep = KEYWORDS.some(k => upperLine.includes(k));
                        currentInfo = line;
                    } else if (line.startsWith('http') && shouldKeep) {
                        output.write(currentInfo + "\n" + line + "\n");
                        count++;
                        shouldKeep = false;
                    }
                });

                rl.on('close', () => {
                    // We wait for the file to completely finish saving before closing
                    output.end(() => {
                        const stats = fs.statSync('master.m3u');
                        console.log(`SUCCESS: Filtered ${count} channels. Final size: ${Math.round(stats.size / 1024)} KB`);
                    });
                });
            });
        } else {
            console.error("Link not found. Update your OTTC_COOKIE in GitHub Secrets!");
            process.exit(1);
        }
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

updateM3u();
