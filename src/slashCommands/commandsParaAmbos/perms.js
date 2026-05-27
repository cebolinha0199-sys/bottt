const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ActivityType, ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, AttachmentBuilder, ComponentType } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { permsConfigTicket, permsConfigVendas } = require("../../../Functions/addperm");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })


module.exports = {
    data: new SlashCommandBuilder()
        .setName("perms")
        .setDescription("Adicione ou remova permissão nos bots.")
        .addStringOption(opString => opString
            .setName("ação")
            .setDescription("Selecione o tipo de aplicação")
            .addChoices(
                { name: "Ticket", value: "optionTicket" },
                { name: "Vendas", value: "optionVendas" }
            )
            .setRequired(true)
        ),

    async execute(interaction, client) {
        if (interaction.user.id !== getCache(null, 'owner')) {
            interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`13`)} | Você não tem permissão para usar este comando!` })
            return;
        }
        const getOption = interaction.options.getString("ação");
        let type = getCache(null, 'type')
        const permissionTicket = type?.Ticket?.status
        const permissionVendas = type?.Vendas?.status

        const embedSelect = new EmbedBuilder()
            .setTitle('Configurar BOT')
            .setDescription([
                '- Você só poderá configurar a aplicação que estiver em seu plano.',
                '- Abaixo você pode acompanhar o status de suas aplicações.'
            ].join('\n'))
            .addFields(
                { name: `Bot Vendas:`, value: `${permissionVendas}`, inline: true },
                { name: `Bot Ticket:`, value: `${permissionTicket}`, inline: true }
            )

        if (getOption == 'optionTicket') {
            if (permissionTicket === false) {
                return interaction.reply({
                    content: `❌ | Para usar os comandos de **TICKET** habilite renovando em nosso site o módulo.`,
                    embeds: [embedSelect],
                    flags: MessageFlags.Ephemeral
                })
            } else {
                await permsConfigTicket(client, interaction)
            }
        } else if (getOption == 'optionVendas') {
            if (permissionVendas === false) {
                return interaction.reply({
                    content: `❌ | Para usar os comandos de **VENDAS** habilite habilite renovando em nosso site o módulo.`,
                    embeds: [embedSelect],
                    flags: MessageFlags.Ephemeral
                })
            } else {
                await permsConfigVendas(client, interaction)
            }
        }
    }
}