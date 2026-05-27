const { ActivityType } = require("discord.js");
const colors = require("colors");
const axios = require("axios");
const config = require("../../../token.json");
const { JsonDatabase } = require("wio.db");
const fs = require("fs");
const path = require("path");
const { initDatabase, dbMessageAuto } = require("../../../databases/autoMessages");
const { where } = require("sequelize");
const { updateCache } = require("../../../Functions/connect_api");
const { EntregarCarrinho, AvaliacaoCancel } = require("../../../Functions/Pagamentos/EntregarProduto");
const { SetCallBack, GenerateToken } = require("../../../Functions/Pagamentos/EfiBank.js");
const { VerificarPagamento } = require("../../../Functions/Pagamentos/AprovarPagamentos");
const { UpdateMsgs, UpdateSelects } = require("../../../Functions/Paginas/UpdateMsgs");
const { agendarMensagens } = require("../../../Functions/Paginas/MensagemAutomatica");
const ExpirarCART = require("../../../Functions/Pagamentos/ExpirarCart");
const lockChannelSystem = require('../eventsFunctions/lockUnlock');
const { initGiveawaySystem } = require('../eventsFunctions/giveaways');
const { initModeration } = require('../eventsFunctions/moderation');
const { loadConfig } = require("../eventsFunctions/moderation/config/loadConfig");
const { connectIMAP } = require("../../../Functions/Pagamentos/Nubank");
// Banco de dados para emojis
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

module.exports = {
    name: "ready",
    async execute(client) {
        const guilds = client.guilds.cache;
        for (const guild of guilds) {
            try {
                await guild.members.fetch();
            } catch (error) {
                error
            }
        }

        if (dbConfigs.get(`vendas.payments.lenguage`) == null || dbConfigs.get(`vendas.payments.lenguage`) == undefined || dbConfigs.get(`vendas.payments.lenguage`) == "BRL") {
            global.lenguage = {
                "um": "pt-BR",
                "dois": "BRL",
                "stripe": "brl",
            }
        } else if (dbConfigs.get(`vendas.payments.lenguage`) == "EUR") {
            global.lenguage = {
                "um": "nl-NL",
                "dois": "EUR",
                "stripe": "eur",
            }
        } else if (dbConfigs.get(`vendas.payments.lenguage`) == "USD") {
            global.lenguage = {
                "um": "pt-BR",
                "dois": "USD",
                "stripe": "usd",
            }
        } else {
            global.lenguage = {
                "um": "pt-BR",
                "dois": "BRL",
                "stripe": "brl",
            }
        }

        setInterval(() => {
            ExpirarCART(client)
        }, 5000);

        updateCache(client)

        setInterval(() => {
            updateCache(client)
        }, 20000)

        agendarMensagens(client)


        setInterval(() => {
            EntregarCarrinho(client)
        }, 5000);

        if (await dbConfigs.get(`vendas.payments.Nubank`)) {
            let typebank = await dbConfigs.get(`vendas.payments.NubankType`)
            if (typebank == null) return await dbConfigs.set(`vendas.payments.Nubank`, false)
            let email = await dbConfigs.get(`vendas.payments.NubankEmail`)
            let senha = await dbConfigs.get(`vendas.payments.NubankSenha`)
            if (email == null || senha == null) return await dbConfigs.set(`vendas.payments.Nubank`, false)
            let imapConfig = {
                user: `${email}`,
                password: `${senha}`,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                keepalive: true,
                idleInterval: 10000,
                forceNoop: true,
                interval: 10000,
            };

            connectIMAP(typebank, imapConfig)
                .then(async message => {
                })
                .catch(async error => {
                });
        }


        if (await dbConfigs.get(`vendas.payments.EfiBankClientSecret`) !== null && await dbConfigs.get(`vendas.payments.EfiBankClientID`) !== null) {
            GenerateToken(null, null, null, client).then(async () => {
                SetCallBack(client)
            })
        }

        setInterval(async () => {
            if (await dbConfigs.get(`vendas.payments.EfiBankClientSecret`) !== null && await dbConfigs.get(`vendas.payments.EfiBankClientID`) !== null) {
                GenerateToken(null, null, null, client).then(async () => {
                    SetCallBack(client)
                })
            }
        }, 60000 * 5);

        setInterval(() => {
            VerificarPagamento(client)
        }, 5000);





        try {
            console.log(`${colors.green(`[READY]`)} ${client.user.username} agora está ligado!`);
            console.log(`${colors.green(`[SERVERS]`)} Estou em ${client.guilds.cache.size} servidores`);
            if (client.guilds.cache.size === 1) {
                const guild = client.guilds.cache.first();
                console.log(`${colors.green(`[SERVERS]`)} Estou no servidor: ${guild.name}`);
                loadConfig(guild.id);
            } else {
                console.log(`${colors.green(`[SERVERS]`)} Estou em vários servidores`);
            }
            console.log(`${colors.green(`[MODERATIONS]`)} Servindo ${client.users.cache.size} pessoas\n`);


            UpdateMsgs(client, null)
            UpdateSelects(client, null)

            lockChannelSystem.initializeLockUnlockSystem(client);

            initGiveawaySystem(client);
            initModeration(client);


            // setInterval(async () => {
            //     await AvaliacaoCancel(client)
            // }, 5000);

            const emojisResponse = await axios.get(
                `https://discord.com/api/v10/applications/${client.user.id}/emojis`,
                {
                    headers: {
                        Authorization: `Bot ${config.token}`
                    }
                }
            );

            const rawItems = emojisResponse.data?.items || [];
            const existingEmojis = rawItems.filter(item => item && item.id && item.name);

            if (!Array.isArray(existingEmojis)) {
                console.error(`${colors.red(`[ERROR]`)} Resposta inválida da API. Nenhum array encontrado.`);
                return;
            }

            const storedEmojis = dbe.all() || {};
            for (const emoji of existingEmojis) {
                const { name, id } = emoji;
                if (!storedEmojis[name] || storedEmojis[name] === "") {
                    dbe.set(name, id);
                }
            }

            const emojisPath = './emojis';
            const emojiFiles = fs.readdirSync(emojisPath).filter(file => /\.(png|jpg|jpeg|gif)$/.test(file));

            if (emojiFiles.length === 0) {
                console.log(`${colors.red(`[EMOJIS]`)} Nenhum arquivo encontrado na pasta de emojis.`);
                return;
            }

            const newEmojis = {};
            for (const file of emojiFiles) {
                const filePath = path.join(emojisPath, file);
                const stats = fs.statSync(filePath);

                if (stats.size > 256 * 1024) {
                    console.error(`${colors.red(`[EMOJIS]`)} O arquivo "${file}" excede o limite de 256 KB.`);
                    continue;
                }

                const rawEmojiName = path.parse(file).name;
                let emojiName = rawEmojiName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
                if (emojiName.length < 2) emojiName = `emoji_${emojiName}`;
                emojiName = emojiName.slice(0, 32);

                const emojiExists = existingEmojis.some(e => e.name === emojiName);
                if (emojiExists) {
                    continue;
                }

                if (storedEmojis[emojiName] && storedEmojis[emojiName] !== "") {
                    continue;
                }

                try {
                    const response = await axios.post(
                        `https://discord.com/api/v10/applications/${client.user.id}/emojis`,
                        {
                            name: emojiName,
                            image: `data:image/${path.extname(file).substring(1)};base64,${fs.readFileSync(filePath, { encoding: 'base64' })}`
                        },
                        {
                            headers: {
                                Authorization: `Bot ${config.token}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    newEmojis[emojiName] = response.data.id;
                } catch (error) {
                    console.error(`${colors.red(`[EMOJIS]`)} Erro ao enviar emoji "${emojiName}":`, error.response?.data || error.message);
                }
            }

            for (const [name, id] of Object.entries(newEmojis)) {
                dbe.set(name, id);
            }

            console.log(`${colors.green(`[EMOJIS]`)} Emojis enviados e banco de dados atualizado.`);
        } catch (error) {
            console.error(`${colors.red(`[ERROR]`)} Falha ao executar inicialização:`, error.response?.data || error.message);
        }

        await initDatabase();

        setInterval(async () => {
            const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' })
            const messagesToSend = await dbMessageAuto.findAll({ where: { sendHour: now, On_Off: 'ON' } });

            for (const message of messagesToSend) {
                try {
                    if (message.channelID !== 'none') {
                        const channel = await client.channels.fetch(message.channelID)
                        if (channel) {
                            if (message.messageStyle === 'Texto') {
                                await channel.send(message.messageSend)
                            }

                            if (message.messageStyle === 'Embed') {
                                const embedToSend = {
                                    title: message.embedTitle !== 'none' ? message.embedTitle : null,
                                    description: message.embedDescription !== 'none' ? message.embedDescription : null,
                                    color: message.embedColor || 0xFFFFFF,
                                    thumbnail: {
                                        url: message.embedThumbnail !== 'https://sem-img.com' ? message.embedThumbnail : null
                                    },
                                    image: {
                                        url: message.embedImage !== 'https://sem-img.com' ? message.embedImage : null
                                    }
                                }
                                await channel.send({ embeds: [embedToSend] })
                            }
                        } else {
                            message.update({ On_Off: 'OFF' })
                        }
                    } else {
                        message.update({ On_Off: 'OFF' })
                        continue
                    }
                } catch (error) {
                    console.error('Erro ao enviar mensagem agendada:', error)
                    continue
                }
            }
        }, 5000);

    },
};
