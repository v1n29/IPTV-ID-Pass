const fs = require('fs');

const COOKIE = process.env.OTTC_COOKIE;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

async function updateM3u() {
    console.log("Initiating Serverless Shadow Protocol...");
    
    try {
        const pageResponse = await fetch('https://freeiptv2023-d.ottc.xyz/index.php?action=view', {
            headers: {
                'Cookie': COOKIE,
                'User-Agent': USER_AGENT,
                'Referer': 'https://freeiptv2023-d.ottc.xyz/index.php'
            }
        });
        
        const html = await pageResponse.text();
        
        // THE FIX: We changed the scanner to grab the ENTIRE URL including the fresh password
        const linkMatch = html.match(/http:\/\/freeiptv\.ottc\.xyz:80\/get\.php\?[^"'\s<>]+/);

        if (linkMatch) {
            // We use the exact, untouched link the website generated
            let freshUrl = linkMatch[0];
            
            // Just ensuring it's formatted for M3U if the site forgot
            if (!freshUrl.includes('type=m3u')) {
                freshUrl += "&type=m3u_plus&output=ts";
            }
            
            console.log("Success! Captured full dynamic link:", freshUrl);

            const m3uResponse = await fetch(freshUrl, {
                headers: {
                    'Cookie': COOKIE,
                    'User-Agent': USER_AGENT
                }
            });
            
            const m3uContent = await m3uResponse.text();
            
            if (m3uContent.length < 100) {
                console.error("CRITICAL FAILURE: The server returned an empty file or error page!");
                console.log("Server response:", m3uContent);
                process.exit(1); 
            }
            
            fs.writeFileSync('master.m3u', m3uContent);
            console.log("WAR WON! Playlist downloaded and it is full of channels!");
        } else {
            console.error("CRITICAL FAILURE: Link not found. The cookie has likely expired.");
            process.exit(1); 
        }
    } catch (error) {
        console.error("Network Error:", error.message);
        process.exit(1);
    }
}

updateM3u();
