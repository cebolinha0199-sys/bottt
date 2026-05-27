const { MessageFlags, EmbedBuilder } = require("discord.js");
const { ChannelType } = require("discord.js");
const { joinVoiceChannel } = require('@discordjs/voice');
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const { getCache } = require("../../../Functions/connect_api");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("conectar")
        .setDescription("[🛠/💰] Me conecte em um canal de voz!")
        .addChannelOption(opChannel => opChannel
            .setName(`canal`)
            .setDescription(`Selecione um canal de voz`)
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        ),

    async execute(interaction, client) {
        const type = getCache(null, 'type');
        const dono = getCache(null, "owner");

        if (type?.Vendas?.status == false && type?.Ticket?.status == false) {
            return await interaction.editReply({
                content: `❌ | Você não possui acesso a nenhum de nossos sistemas, adquira um plano em nosso site. [CLIQUE AQUI](https://nevermissapps.com/dashboard) para ser redirecionado.`,
            });
        }

        const isVendas = (await dbPerms.get('vendas'))?.includes(interaction.user.id);
        const isTicket = (await dbPerms.get('ticket'))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isVendas && !isTicket && !isOwner) {
            return await interaction.editReply({
                content: `❌ | Você não tem permissão para usar este comando.`,
            });
        }

        const channelSelected = interaction.options.getChannel(`canal`);

        try {
            joinVoiceChannel({
                channelId: channelSelected.id,
                guildId: channelSelected.guild.id,
                adapterCreator: channelSelected.guild.voiceAdapterCreator,
            });

            await interaction.reply({
                content: `✅ | BOT conectado com sucesso no canal de voz ${channelSelected}.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (err) {
            await interaction.reply({
                content: `❌ | Ocorreu um erro ao conectar o BOT no canal de voz ${channelSelected}.`,
                flags: MessageFlags.Ephemeral
            });
        };
    },
};