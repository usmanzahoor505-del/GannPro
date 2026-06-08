import fs from "fs";
import path from "path";
import https from "https";

const LOGO_URLS = {
  jazzcash: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/JazzCash_logo_%282025%29.png/512px-JazzCash_logo_%282025%29.png",
  easypaisa: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Easypaisa_Digital_Bank_logo.png/512px-Easypaisa_Digital_Bank_logo.png",
  nayapay: "https://play-lh.googleusercontent.com/BfI82U_EwZ61oDkU51_227G-hYk_6KskqXmEsw4x398LwL3W9GzB65R-d5J7lVqCeg=s512-rw",
  sadapay: "https://play-lh.googleusercontent.com/PZc_v-a7hIqB4nUeJ33R8Z6x-Q2bZ6x-CqGz9YJkK5zB65R-d5J7lVqCeg=s512-rw",
  meezan: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Meezan_Bank_Logo.svg/512px-Meezan_Bank_Logo.svg.png",
  hbl: "https://upload.wikimedia.org/wikipedia/en/thumb/f/fc/Habib_Bank_Limited_logo.svg/512px-Habib_Bank_Limited_logo.svg.png",
  ubl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/United_Bank_Limited_logo.svg/512px-United_Bank_Limited_logo.svg.png",
};

const publicDir = path.resolve(process.cwd(), "public");
const logosDir = path.resolve(publicDir, "logos");

// Create directories if they do not exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir);
}

function downloadImage(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    };
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (Status Code: ${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function start() {
  console.log("Downloading bank logos with headers...");
  for (const [name, url] of Object.entries(LOGO_URLS)) {
    const dest = path.join(logosDir, `${name}.png`);
    try {
      await downloadImage(url, dest);
      console.log(`Successfully downloaded logo: ${name}`);
    } catch (err) {
      console.error(`Failed to download logo for ${name}:`, err);
    }
  }
  console.log("Done!");
}

start().catch(console.error);
