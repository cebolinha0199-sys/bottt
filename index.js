const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot online!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor web ligado!");
});

const axios = require("axios");
const config = require("./token.json");
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType } = require("discord.js");
const { readdirSync } = require("node:fs");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("./Functions/connect_api");

const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbDataTickets = new JsonDatabase({ databasePath: "./databases/data_ticket.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();

const handlers = readdirSync("./src/handler").filter((file) => file.endsWith(".js"));

for (const file of handlers) {
    require(`./src/handler/${file}`)(client);
}

client.handleCommands("./src/slashCommands");

client.on("guildBanRemove", (ban) => {
    console.log(`guildBanRemove: ${ban}`);
});

client.once("ready", async () => {
    console.log(`[READY] Bot ${client.user.tag} está ligado!`);

    if (dbConfigs.get("dbRedefine") === false || dbConfigs.get("dbRedefine") === null) {
        dbConfigs.set("ticket.ticket.cargo_staff", []);
        dbConfigs.set("dbRedefine", true);
    }

    const guilds = client.guilds.cache;

    try {
        guilds.forEach(async (guild) => {
            const allData = dbDataTickets.all();

            for (const key in allData) {
                const channelID = allData[key].ID;
                const channel = guild.channels.cache.get(channelID);

                if (!channel) {
                    dbDataTickets.delete(channelID);
                }
            }
        });
    } catch (error) {
        console.log(error);
    }

    const updateBotProfile = async () => {
        try {
            const cacheData = getCache(null, "additional");

            if (cacheData === false) {
                console.log("Cache não disponível, tentando novamente em 20 segundos");
                setTimeout(updateBotProfile, 20000);
                return;
            }

            if (!cacheData?.includes("status")) {
                await Promise.all([
                    updateBotPresence(),
                    updateBotDescription()
                ]);
            }
        } catch (error) {
            console.error("Erro ao atualizar perfil do bot:", error);
        }
    };

    const updateBotPresence = async () => {
        try {
            client.user.setPresence({
                activities: [
                    {
                        name: "🤖 Applications",
                        type: ActivityType.Custom
                    }
                ],
                status: "online"
            });
        } catch (error) {
            console.error("Erro ao atualizar presença:", error);
        }
    };

    const updateBotDescription = async () => {
        const description = [
            "**NeverMiss Applications!**",
            "https://nevermiss.app"
        ].join("\n");

        const updateData = {
            description,
            custom_install_url: "https://discord.gg/",
            install_params: null
        };

        try {
            const url = `https://discord.com/api/v9/applications/${client.user.id}`;

            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    Authorization: `Bot ${config.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API retornou status ${response.status}: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {}
    };

    const THIRTY_MINUTES = 60000 * 30;

    updateBotProfile();

    const intervalId = setInterval(updateBotProfile, THIRTY_MINUTES);

    client.profileUpdateInterval = intervalId;

    client.cleanupProfileUpdater = () => {
        if (client.profileUpdateInterval) {
            clearInterval(client.profileUpdateInterval);
            client.profileUpdateInterval = null;
        }
    };

    try {
        const getMember = await client.users.fetch(getCache(null, "owner"));

        if (client.guilds.cache.size > 1) {
            const embedSend = new EmbedBuilder()
                .setTitle("❗ | Servidores em excesso.")
                .setDescription([
                    `- Olá ${getMember}!`,
                    "- Percebemos que sua aplicação estava em mais de 1 servidor e isso não é permitido por nossa equipe.",
                    "- Caso queira adicioná-la em mais de um servidor, compre outra permissão.",
                    "- Caso isso tenha ocorrido sem sua permissão, contate nosso suporte em: <#1289642313467039929>.",
                    "\u200b",
                    "- Caso tenha saído do nosso servidor: https://discord.gg/"
                ].join("\n"))
                .setColor(0xff0000)
                .setFooter({ text: "NeverMiss Applications - Todos os direitos reservados." });

            await getMember.send({ embeds: [embedSend] });

            for (const guild of guilds.values()) {
                try {
                    await guild.leave();
                    console.log(`Saí do servidor: ${guild.name}`);
                } catch (error) {
                    console.error(`Erro ao sair do servidor ${guild.name}:`, error);
                }
            }
        }
    } catch (error) {
        if (error.code !== 50035) {
            console.log(`${error}`);
        }
    }
});

client.on("guildCreate", async (guild) => {
    console.log(`Bot entrou em um novo servidor: ${guild.name}.`);

    try {
        const getMember = await client.users.fetch(getCache(null, "owner"));

        if (client.guilds.cache.size > 1) {
            try {
                await getMember.send({
                    content: `❗ | Houve uma tentativa de adicionar sua aplicação em outro servidor. Por segurança, a aplicação saiu desse servidor.\n⏩ | Servidor em questão: **${guild.name}**.`
                });
            } catch (error) {
                console.error(`Descrição do erro: ${error}`);
            }

            guild.leave()
                .then(() => console.log(`Saiu do servidor ${guild.name}`))
                .catch(console.error);
        }
    } catch (error) {
        if (error.code !== 50035) {
            console.log(`${error.message}`);
        }
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const dbConfigsMessage = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

    if (dbConfigsMessage.get("ticket.sugest.sistema") === "ON") {
        const channelId = dbConfigsMessage.get("ticket.sugest.channel");

        if (message.channel.id === channelId) {
            await message.react(dbConfigsMessage.get("ticket.sugest.certo") || "✔");
            await message.react(dbConfigsMessage.get("ticket.sugest.errado") || "❌");

            const user = message.author;

            const thread = await message.startThread({
                name: `Sugestão de ${user.displayName}`,
                autoArchiveDuration: 10080,
                reason: `Sugestão de ${user.displayName}`
            });

            await thread.send(`Olá ${user} 👋, obrigado por enviar sua sugestão! Caso necessário, explique melhor.`);
        }
    }
});

function handleError(error, origin) {
    console.error("\n--------------------------------");
    console.error(`Error occurred: ${error.message}`);
    console.error(`Origin: ${origin}`);
    console.error("Stack Trace:\n", error.stack);
    console.error("--------------------------------\n");
}

process.on("multipleResolutions", handleError);
process.on("unhandledRejection", handleError);
process.on("uncaughtException", handleError);
process.on("uncaughtExceptionMonitor", handleError);

module.exports = client;

client.login(config.token);