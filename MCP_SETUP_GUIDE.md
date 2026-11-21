# MetScheduler - MCP & ChatGPT Integration Guide

## 1. Background Kya Hai? (Background Scheduler Overview)
MetScheduler ke andar ek **Background Scheduler Service** (`server/services/schedulerService.ts`) chalti hai jo `node-cron` use karti hai:
- **Har minute (`* * * * *`)** ye background worker automatically run hota hai.
- Ye MongoDB database mein check karta hai ke kaunsi posts `status: "scheduled"` hain aur unka `scheduledFor` waqt ho chuka hai (`$lte: new Date()`).
- Jab koi scheduled post milti hai, to ye **Zernio API** ke zariye aapke connected social accounts (LinkedIn, Twitter/X, Facebook, Instagram, etc.) par automatically content aur images publish kar deta hai.
- Publish hone ke baad status ko `"published"` mark karta hai aur Activity Log create karta hai.

---

## 2. MCP (Model Context Protocol) Kya Hai?
**MCP (Model Context Protocol)** ek open standard protocol hai jo AI assistants (jaise ChatGPT, Claude, Antigravity) ko aapke local tools, database aur APIs ke saath connect karta hai.
MCP ke zariye ChatGPT seedha aapke MetScheduler se baat karke:
1. Aapke connected social accounts check kar sakta hai (`metscheduler_list_accounts`).
2. Nayi social media posts schedule kar sakta hai (`metscheduler_schedule_post`).
3. Scheduled aur published posts ki list dekh sakta hai (`metscheduler_list_posts`).
4. Kisi post ko foran live publish kar sakta hai (`metscheduler_publish_now`).

---

## 3. ChatGPT Desktop / Claude Desktop Mein MCP Kaise Connect Karein?

MetScheduler ke paas dedicated MCP Server (`server/mcpServer.ts`) mojood hai jo standard `stdio` transport par chalta hai.

### Setup Steps:
1. **ChatGPT Desktop Config**:
   ChatGPT Desktop (ya Claude Desktop) ki configuration file open karein:
   - **Windows Path**: `%APPDATA%\OpenAI\chatgpt_desktop_config.json` (ya Claude ke liye `%APPDATA%\Claude\claude_desktop_config.json`)

2. Is configuration file mein `mcpServers` section add karein:
```json
{
  "mcpServers": {
    "metscheduler": {
      "command": "node",
      "args": [
        "D:\\MetScheduler\\server\\node_modules\\tsx\\dist\\cli.mjs",
        "D:\\MetScheduler\\server\\mcpServer.ts"
      ],
      "env": {
        "MONGODB_URI": "mongodb+srv://met-scheduler:1425Metri@cluster0.ugnpcq2.mongodb.net/scheduler",
        "ZERNIO_API_KEY": "sk_b765e806fe09beec3e16effeebaadafa85fdc2992cd7b76cb786cf54d911e799"
      }
    }
  }
}
```

3. ChatGPT ya Claude Desktop ko restart karein.
4. Ab aap ChatGPT mein seedha keh sakte hain:
   > *"LinkedIn aur Twitter ke liye kal dopahar 2 baje ek AI update post schedule karo."*
   ChatGPT automatically `metscheduler_schedule_post` call karega aur aapke MetScheduler database mein post schedule ho jayegi!

---

## 4. ChatGPT Web (Custom GPT Actions) Se Kaise Connect Karein?
Agar aap ChatGPT Web (Plus/Team/Enterprise) use kar rahe hain:
1. **ChatGPT** mein **Explore GPTs** -> **Create a GPT** par jayein.
2. **Configure** tab mein **Actions** -> **Create new action** select karein.
3. Server ka URL dalein (e.g. ngrok / cloud URL ya local proxy).
4. Authentication mein `Bearer Token` select karke apna MetScheduler login token add karein.
5. Endpoints:
   - `GET /api/accounts` -> Connected accounts list
   - `POST /api/posts` -> Schedule post
   - `GET /api/posts` -> View posts

---

## 4. Multi-User Remote HTTP MCP Server (`/api/mcp` & `/mcp`)
MetScheduler ab multi-user Remote HTTP JSON-RPC 2.0 MCP server bhi provide karta hai:
- **Remote Endpoint**: `http://localhost:3000/api/mcp` (aur `/mcp`)
- **Per-User MCP Key**: Har user ka apna unique key hota hai (e.g. `met_mcp_xxxxxxxxxxxx`). User apne **Settings** page par jakar **"Connect ChatGPT MCP"** button par click karke apna personal key copy kar sakta hai ya naya key regenerate kar sakta hai.
- **Authentication**:
  Header `X-MCP-API-KEY: met_mcp_your_key` ya `Authorization: Bearer met_mcp_your_key`
- **OpenAPI Schema Specification**: `http://localhost:3000/api/mcp/openapi.json` (Custom GPT Actions mein direct import karne ke liye).

### Tools Available in Remote MCP:
1. `metscheduler_list_accounts`: List user's connected social platforms.
2. `metscheduler_schedule_post`: Schedule content across accounts with ISO date/time.
3. `metscheduler_list_posts`: View scheduled, published, and failed posts.
4. `metscheduler_publish_now`: Publish post immediately.
5. `get_my_profile`: View profile info and active plan.
6. `get_subscription_details`: View current plan status and limits.

---

## 5. Tamam Fixes Summary (Login, Payments, Redis & Security):
1. **Nodemon App Crash Fix**:
   - `connectDB()` se `process.exit(1)` hata diya gaya hai taake DNS ya network delay par server crash na ho.
   - `app.listen()` ko pehle start karwaya hai taake server hamesha running rahe (`http://localhost:3000`).
   - Root level par `package.json` aur `.env` add kiya gaya hai taake kisi bhi folder se run karne par path crash na ho.
2. **Login Network Error Fix**:
   - Client `vite.config.ts` mein `/api` proxy add kiya gaya hai to `http://127.0.0.1:3000`.
   - Host `0.0.0.0` kar diya gaya hai taake IPv4 aur IPv6 localhost conflicts khatam ho jayein.
   - Server mein full CORS allowed origins aur credentials enable kar diye gaye hain.
3. **OAuth Integration Fix**:
   - OAuth redirect origin ko dynamically client request origin (`req.headers.origin` / `referer`) se match karwaya hai taake user ka login session redirect ke waqt drop na ho.
   - Twitter ("x"), Facebook Pages, LinkedIn Pages aur digar platforms ko platform normalization mein add kiya gaya hai.
   - Accounts model aur UI mein all supported platforms show hone lage hain aur ek one-click "Sync" button bhi add kiya gaya hai.
