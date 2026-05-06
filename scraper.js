const fs = require('fs');
const http = require('http'); // Using the tank instead of fetch for the big file
const { pipeline } = require('stream/promises');

const COOKIE = process.env.OTTC_COOKIE;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

async function updateM3u() {
    console.log("Initiating Old-Reliable Shadow Protocol...");
    
    try {
        // We still use fetch for the tiny HTML page (it's safe here)
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
            
            console.log("Success! Link Captured. Starting robust download...");

            // THE TANK: We use http.get because it won't crash on "terminated" errors
            const request = http.get(freshUrl, {
                headers: {
                    'Cookie': COOKIE,
                    'User-Agent': USER_AGENT,
                    'Referer': 'https://freeiptv2023-d.ottc.xyz/'
                }
            }, async (res) => {
                if (res.statusCode !== 200) {
                    console.error("Server rejected the request! Status: " + res.statusCode);
                    process.exit(1);
                }

                const fileStream = fs.createWriteStream('master.m3u');
                
                try {
                    await pipeline(res, fileStream);
                    const stats = fs.statSync('master.m3u');
                    console.log("WAR WON! Saved " + Math.round(stats.size / 1024) + " KB to master.m3u");
                } catch (err) {
                    console.error("Download failed mid-stream: " + err.message);
                    process.exit(1);
                }
            });

            request.on('error', (err) => {
                console.error("Network Request Error: " + err.message);
                process.exit(1);
            });

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

