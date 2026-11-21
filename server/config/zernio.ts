import "dotenv/config";
import dotenv from "dotenv";
import path from "node:path";
import { Zernio } from "@zernio/node";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });

let instance: Zernio | null = null;

function getClient(): Zernio {
  if (!instance) {
    const apiKey = process.env.ZERNIO_API_KEY?.trim();
    if (!apiKey) {
      console.warn("⚠️ Warning: ZERNIO_API_KEY is not defined in .env");
    }
    instance = new Zernio({
      apiKey: apiKey || "sk_placeholder_fallback",
      baseURL: "https://zernio.com/api",
    });
  }
  return instance;
}

const zernio = new Proxy({} as Zernio, {
  get(_target, prop, receiver) {
    const client = getClient();
    const val = Reflect.get(client, prop, receiver);
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

export default zernio;
