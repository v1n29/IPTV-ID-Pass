const fs = require('fs');

// It secretly pulls your cookie from the GitHub Vault
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
        const linkMatch = html.match(/http:\/\/freeiptv\.ottc\.xyz:80\/get\.php\?username=[^&"'> ]+/);

        if (linkMatch) {
            const freshUrl = linkMatch[0] + "&password=429150658646&type=m3u_plus&output=ts";
            console.log("Success! Downloading fresh payload...");

            const m3uResponse = await fetch(freshUrl);
            const m3uContent = await m3uResponse.text();
            
            // Saves it directly to the GitHub repository folder
            fs.writeFileSync('master.m3u', m3uContent);
            console.log("WAR WON! Playlist updated!");
        } else {
            console.error("CRITICAL FAILURE: Link not found. The cookie has likely expired.");
            process.exit(1); // This tells GitHub to mark the run as "Failed" so you get an email alert!
        }
    } catch (error) {
        console.error("Network Error:", error.message);
        process.exit(1);
    }
}

updateM3u();
