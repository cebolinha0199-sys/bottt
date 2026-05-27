const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ActivityType, ApplicationCommandType, PermissionFlagsBits } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db")
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })
const dbDataTickets = new JsonDatabase({ databasePath: "./databases/data_ticket.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const Discord = require("discord.js");
const { getCache } = require("../../../Functions/connect_api");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("paineis-ticket")
        .setDescription("Abra os paineis de interação do seu ticket por esse comando."),

    async execute(interaction, client) {
        
        //let type = getCache(null, 'type')
        //if (type?.Ticket?.status === false) {
           // interaction.reply({ content: `❌ | Você não possui acesso a nosso módulo de **TICKET**, adquira um em nosso site renovando seu bot. [CLIQUE AQUI](https://nevermissapps.com/dashboard) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
            //return
        //}

        

        if (!dbDataTickets.get(`${interaction.channel.id}`)) {
            interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`13`)} | Não tem nenhum ticket aberto neste canal!` })
            return;
        }
        const Embed = new EmbedBuilder()
            .setAuthor({ name: `Interagindo com Paineis Ticket`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setDescription(`Selecione abaixo qual painel deseja abrir :)`)
            .setColor(dbConfigs.get("color"))

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("painel_member")
                    .setLabel("Painel Membro")
                    .setEmoji(dbConfigs.get(`ticket.painel.button.membro`))
                    .setStyle(2),
                new ButtonBuilder()
                    .setCustomId("painel_staff")
                    .setLabel("Painel Staff")
                    .setEmoji(dbConfigs.get(`ticket.painel.button.staff`))
                    .setStyle(2),
            )

        interaction.reply({ embeds: [Embed], components: [row], flags: MessageFlags.Ephemeral })
        const perm = interaction.channel.permissionOverwrites
        console.log(perm.guild)
    }
}