import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    apiRoot: 'https://api.telegram.org'
  }
});

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN env var is required");

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
const MODE = "all";
bot.on("message", async (ctx) => {
  const msg = ctx.message;

  const text = msg.text ?? msg.caption ?? "";
  const entities = msg.entities ?? msg.caption_entities ?? [];
  if (MODE === "all")
  {
    let allLines = entities.map(e => {
      const visible = text.slice(e.offset, e.offset + e.length);
      let ret = `${e.type}: == <tg-emoji emoji-id="${e.custom_emoji_id}">${visible}</tg-emoji> ==\n`
	     +  Object.entries(e).filter(([key, value]) => key !== "type").map(([key, value]) => ` + ${key} = ${value}`).join('\n')
	     +  `\n<code>${escapeHtml(`<tg-emoji emoji-id="${e.custom_emoji_id}">${visible}</tg-emoji>`)}</code>`
	     +  '\n';
      return ret;
    }).join('\n');
    if (allLines.length > 0)
      await ctx.telegram.sendMessage(ctx.chat.id, allLines, {
        reply_to_message_id: msg.message_id,
        parse_mode: 'html', 
      });
    return;
  }
  const customEmojis = entities
    .filter(e => e.type === "custom_emoji" && e.custom_emoji_id)
    .sort((a, b) => a.offset - b.offset); // сохраняем порядок

  if (customEmojis.length === 0) {
    return;
	  //return ctx.reply("Send a message containing custom emojis.");
  }

  const lines = customEmojis.map(e => {
    const visible = text.slice(e.offset, e.offset + e.length);
    let emoji_html_tag = `<tg-emoji emoji-id="${e.custom_emoji_id}">${visible}</tg-emoji>`;
    //return `<code>${escapeHtml(e.custom_emoji_id)}</code>`;
    return `<code>${escapeHtml(emoji_html_tag)}</code>`;
  });

  const output = lines.join("\n");

  await ctx.telegram.sendMessage(ctx.chat.id, output, {
	  parse_mode: "html",
	  reply_to_message_id: msg.message_id,
  });
});

bot.catch(err => console.error("Bot error:", err));
bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

