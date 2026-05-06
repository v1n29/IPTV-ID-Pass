const fs = require('fs');
const { pipeline } = require('stream/promises');

const COOKIE = process.env.OTTC_COOKIE;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

async function updateM3u() {
    console.log("Initiating Serverless Shadow Protocol (Heavy-Duty Mode)...");
    
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
            
            console.log("Success! Link Captured. Commencing heavy download...");

            const m3uResponse = await fetch(freshUrl, {
                headers: {
                    'Cookie': COOKIE,
                    'User-Agent': USER_AGENT
                }
            });

            if (!m3uResponse.ok) throw new Error(Server responded with ${m3uResponse.status});

            // THE FIX: We stream the data directly to the disk instead of storing it in a "string"
            const writer = fs.createWriteStream('master.m3u');
            await pipeline(m3uResponse.body, writer);
            
            // Check if file was actually written
            const stats = fs.statSync('master.m3u');
            if (stats.size < 100) {
                console.error("CRITICAL FAILURE: File is too small. Check cookie.");
                process.exit(1);
            }

            console.log(WAR WON! Saved a massive file of ${Math.round(stats.size / 1024)} KB);
        } else {
            console.error("CRITICAL FAILURE: Link not found. Cookie expired.");
            process.exit(1);
        }
    } catch (error) {
        console.error("Heavy-Duty Error:", error.message);
        process.exit(1);
    }
}

updateM3u();
