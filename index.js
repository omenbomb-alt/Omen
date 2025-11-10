import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  PermissionsBitField,
} from "discord.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);
});

// 🎉 Yeni Üye Hoş Geldin Mesajı + Otomatik Rol
// 🎉 Yeni Üye Hoş Geldin Mesajı + Otomatik Rol
client.on("guildMemberAdd", async (member) => {
  const welcomeChannelId = "1436831281169305601"; // Mesajın gideceği kanal
  const autoRoleId = "1436803489761329253"; // Otomatik verilecek rol

  const channel = member.guild.channels.cache.get(welcomeChannelId);
  if (!channel) return;

  // 🎭 Rol Verme
  try {
    await member.roles.add(autoRoleId);
    console.log(`${member.user.tag} kullanıcısına otomatik rol verildi.`);
  } catch (err) {
    console.error("Rol verirken hata:", err);
  }

  // 📅 Hesap oluşturma tarihi
  const accountCreated = new Date(member.user.createdAt).toLocaleDateString(
    "tr-TR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  // 💣 Bombs Hoş Geldin Mesajı
  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle(`💣 Bombs ${new Date().toLocaleDateString("tr-TR")} Hoş Geldin!`)
    .setDescription(`**🔥 Bombs'a Hoş Geldin! 🔥**`)
    .addFields(
      {
        name: "👤 Kullanıcı",
        value: `<@${member.id}> — ${member.user.username}`,
        inline: false,
      },
      { name: "🆔 Kullanıcı ID", value: `${member.id}`, inline: true },
      {
        name: "📅 Hesap oluşturma tarihi",
        value: `${accountCreated}`,
        inline: false,
      },
      {
        name: "📊 Sunucuya giriş sırası",
        value: `${member.guild.memberCount}/${member.guild.memberCount}`,
        inline: true,
      },
      { name: "🔐 Hesap güvenliği", value: "Güvenli ✔", inline: true },
      {
        name: "💬 Bilgilendirme",
        value:
          "Merhabalar! Sunucumuza katıldığın için sana otomatik olarak **👀 Observer** rolü verdim.\nLütfen kuralları okumayı unutma 💣",
      }
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({
      text: "💣 Bombs System",
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  await channel.send({ content: `🎉 **${member.user.username} aramıza katıldı!**`, embeds: [embed] });
});

// 💥 !ban komutu
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!ban") || message.author.bot) return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
    return message.reply("❌ Bu komutu kullanma yetkin yok!");

  const user = message.mentions.users.first();
  if (!user)
    return message.reply("Lütfen bir kullanıcı etiketle! Örnek: `!ban @Kişi sebep`");

  const reason = message.content.split(" ").slice(2).join(" ") || "Sebep belirtilmemiş";
  const member = message.guild.members.cache.get(user.id);

  if (!member) return message.reply("Bu kullanıcı sunucuda bulunamadı.");

  try {
    await member.ban({ reason });
    message.channel.send(`🚨 ${user.tag} banlandı! Sebep: ${reason}`);
  } catch (err) {
    console.error("Ban hatası:", err);
    message.reply(`❌ Ban başarısız! Hata: \`${err.message}\``);
  }
});

// 💥 !kick komutu
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!kick") || message.author.bot) return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
    return message.reply("❌ Bu komutu kullanma yetkin yok!");

  const user = message.mentions.users.first();
  if (!user)
    return message.reply("Lütfen bir kullanıcı etiketle! Örnek: `!kick @Kişi sebep`");

  const reason = message.content.split(" ").slice(2).join(" ") || "Sebep belirtilmemiş";
  const member = message.guild.members.cache.get(user.id);

  if (!member) return message.reply("Bu kullanıcı sunucuda bulunamadı.");

  try {
    await member.kick(reason);
    message.channel.send(`👢 ${user.tag} sunucudan atıldı! Sebep: ${reason}`);
  } catch (err) {
    console.error("Kick hatası:", err);
    message.reply(`❌ Kick başarısız! Hata: \`${err.message}\``);
  }
});

// 🧹 !sil komutu — sadece belirli kullanıcı (sen) kullanabilir
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!sil") || message.author.bot) return;

  // 👑 Sadece bu kullanıcı kullanabilir
  const authorizedUserId = "756241676829327561";
  if (message.author.id !== authorizedUserId)
    return message.reply("❌ Bu komutu kullanma yetkin yok!");

  const args = message.content.split(" ");
  const amount = parseInt(args[1]);

  if (isNaN(amount) || amount <= 0)
    return message.reply("Lütfen silinecek mesaj sayısını belirt! Örnek: `!sil 10`");

  if (amount > 100)
    return message.reply("❗ Aynı anda en fazla 100 mesaj silebilirim (Discord limiti).");

  try {
    await message.channel.bulkDelete(amount + 1, true);
    const msg = await message.channel.send(`🧹 ${amount} mesaj başarıyla silindi!`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);
  } catch (err) {
    console.error("Mesaj silme hatası:", err);
    message.reply("Bir hata oluştu, mesajlar silinemedi ❌");
  }
});



// 🤖 !ai komutu (OpenRouter bağlantısı)
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!ai") || message.author.bot) return;

  const prompt = message.content.slice(3).trim();
  if (!prompt) return message.reply("Ne hakkında konuşmak istersin? 🤔");

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://github.com/kullanici/proje",
          "X-Title": "DiscordBot",
        },
      }
    );

    const reply =
      response.data.choices?.[0]?.message?.content || "Cevap alınamadı.";
    message.reply(reply);
  } catch (error) {
    console.error(error.response?.data || error.message);
    message.reply("Bir hata oluştu ❌");
  }
});

client.login(process.env.DISCORD_TOKEN);
