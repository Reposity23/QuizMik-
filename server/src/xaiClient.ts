import OpenAI from "openai";
import { XAI_API_KEY } from "./config";

export const client = new OpenAI({
  apiKey: XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
  timeout: 120000
});
