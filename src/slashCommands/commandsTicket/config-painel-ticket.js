const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ActivityType, ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, AttachmentBuilder, ComponentType, TextInputStyle } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })
const dbTickets = new JsonDatabase({ databasePath: "./databases/tickets.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("config-painel-ticket")
        .setDescription("Configure um painel ticket"),

    async execute(interaction, client) {
        const choices = [];
        //let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
        //if (type?.Ticket?.status !== true) {
            //interaction.reply({ content: `❌ | Você não possui acesso a nosso módulo de **TICKET**, adquira um em nosso site renovando seu bot. [CLIQUE AQUI](https://nevermissapps.com/dashboard) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
            //return
        //}

        const isInDb = (await dbPerms.get("ticket"))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isInDb && !isOwner) {
            const noPermOption = {
                name: "Você não tem permissão para usar este comando!",
                value: "no-perms"
            };
            choices.push(noPermOption);
            await interaction.respond(
                choices.map(choice => ({ name: choice.name, value: choice.value })),
            );
            return;
        }

        const paineis = dbTickets.all();

        if (!paineis || Object.keys(paineis).length === 0) {
            interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`13`)} | Nenhum painel foi criado ainda!` })
            return;
        }

        const actionrowselect = new StringSelectMenuBuilder()
            .setCustomId('select-config-painel')
            .setPlaceholder('Selecione um painel')

        paineis.map((entry, index) => {
            actionrowselect.addOptions(
                {
                    label: `ID do Painel: ${entry.data.idpainel}`,
                    description: `Tipo: ${entry.data.tipo}`,
                    value: `${entry.data.idpainel}`
                }
            )
        })

        const selectMenu = new ActionRowBuilder()
            .addComponents(actionrowselect)

        const embed = new EmbedBuilder()
            .setTitle(`Configurando Painel Ticket`)
            .setDescription(`Selecione abaixo qual painel você deseja configurar!`)
            .setColor(dbConfigs.get(`ticket.color`) || "Default")

        interaction.reply({ embeds: [embed], components: [selectMenu] })
    }
}