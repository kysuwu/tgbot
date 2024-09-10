import { fail } from "assert";
import axios from "axios";
import dotenv from "dotenv";
import { createReadStream, createWriteStream } from "fs";
import { unlink, writeFile } from "fs/promises";
import { Bot, webhookCallback } from "grammy";
import OpenAI from "openai";
import { tmpdir } from "os";
import { join } from "path";

dotenv.config();
const fileSizeLimit = 1024 * 1024 * 5
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? fail("API not set"),
});

const token = process.env.BOT_TOKEN ?? fail("API not set");
export const bot = new Bot(token);
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.on("message", async (ctx) => {
  if (ctx.message.voice) {
    if(!ctx.message.voice.file_size){
        console.log("missing file_size")
        return
    }
    if(ctx.message.voice.file_size > fileSizeLimit ){
        console.log("file_size exceeds limit")
        ctx.reply("Message is too long.")
        return
    }
    const voicefilepath = join(
      tmpdir(),
      Math.floor(Math.random() * 4e9) + ".oga"
    );
    const file = await ctx.getFile();
    const path = file.file_path!;
    const downloadurl =
      "https://api.telegram.org/file/bot" + token + "/" + path;
    const { data } = await axios.get(downloadurl, { responseType: "arraybuffer" });

    await writeFile(voicefilepath, data);

    console.log("wrote " + data.length + " bytes to " + voicefilepath);

    try {
      const result = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: createReadStream(voicefilepath),
      });

      console.log("done");
      ctx.reply(result.text);
    } finally {
      await unlink(voicefilepath);
    }

    return;
  }
  if (ctx.message.text) {
    ctx.reply(ctx.message.text);
  }
});
