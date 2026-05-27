const { MessageFlags, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbGifts = new JsonDatabase({ databasePath: "./databases/dbGifts.json" });
const dbProfiles = new JsonDatabase({ databasePath: "./databases/dbProfiles.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("resgatar-gift")
        .setDescription("Resgate um GiftCard!")
        .addStringOption(opString => opString
            .setName(`código`)
            .setDescription(`Código do GiftCard`)
            .setMaxLength(18)
            .setRequired(true)
        ),

    async execute(interaction, client) {
      //  let type = getCache(null, 'type')
    //  if (type?.Vendas?.status !== true) {
     //       interaction.reply({ content: `❌ | Comando desabilitado pois o sistema de vendas não está ativo.`, flags: MessageFlags.Ephemeral })
     //       return
     //   }

        const codeInserted = interaction.options.getString(`código`);

        if (!dbGifts.has(codeInserted)) {
            await interaction.reply({
                content: `❌ | O GiftCard inserido é inválido.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        const giftBalance = await dbGifts.get(`${codeInserted}.balance`);

        await dbProfiles.add(`${interaction.user.id}.balance`, Number(giftBalance));
        dbGifts.delete(codeInserted);

        const userBalance = await dbProfiles.get(`${interaction.user.id}.balance`) || 0;

        const embedGiftcard = new EmbedBuilder()
            .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
            .setTitle(`${client.user.username} | Gift Resgatado`)
            .setDescription(`✅ | GiftCard resgatado com sucesso. Foram adicionados **R$__${Number(giftBalance).toFixed(2)}__** em sua conta, agora você está com **R$__${Number(userBalance).toFixed(2)}__** no total.`)
            .setColor(`Green`)
            .setTimestamp();

        await interaction.reply({
            embeds: [embedGiftcard],
            flags: MessageFlags.Ephemeral
        });

        try {
            const channelLogsPriv = interaction.guild.channels.cache.get(dbConfigs.get(`vendas.channels.channelLogsPrivId`));
            if (channelLogsPriv) {
                await channelLogsPriv.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: `${interaction.user.username} - ${interaction.user.id}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })
                        .setTitle(`${client.user.username} | Gift Resgatado`)
                        .setDescription(`🎁 | O ${interaction.user} acaba de resgatar um gift no valor de **R$__${Number(giftBalance).toFixed(2)}__** e agora ele está com **R$__${Number(userBalance).toFixed(2)}__** no total.`)
                        .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                        .setColor(`Green`)
                        .setTimestamp()
                    ]
                });
            };
        } catch (error) {
            console.log('O canal de logs não foi definido.' + error)
        }
    },
};