const fs = require('fs');
const http = require('http');
const zlib = require('zlib'); // The magic shrinking tool
const { pipeline } = require('stream/promises');

const COOKIE = process.env.OTTC_COOKIE;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

async function updateM3u() {
    console.log("Initiating Heavy-Duty Compressed Protocol...");
    
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
            
            console.log("Success! Capturing massive stream and compressing...");

            const request = http.get(freshUrl, {
                headers: {
                    'Cookie': COOKIE,
                    'User-Agent': USER_AGENT,
                    'Referer': 'https://freeiptv2023-d.ottc.xyz/'
                }
            }, async (res) => {
                if (res.statusCode !== 200) {
                    console.error("Server rejected! Status: " + res.statusCode);
                    process.exit(1);
                }

                // THE FIX: We pipe the data through Gzip before saving
                const writer = fs.createWriteStream('master.m3u.gz');
                const compressor = zlib.createGzip();
                
                try {
                    await pipeline(res, compressor, writer);
                    const stats = fs.statSync('master.m3u.gz');
                    console.log("WAR WON! Compressed 500MB+ down to " + Math.round(stats.size / 1024 / 1024) + " MB");
                } catch (err) {
                    console.error("Compression failed: " + err.message);
                    process.exit(1);
                }
            });

        } else {
            console.error("CRITICAL: Link not found.");
            process.exit(1);
        }
    } catch (error) {
        console.error("Protocol Error:", error.message);
        process.exit(1);
    }
}

updateM3u();
