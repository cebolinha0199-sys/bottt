const { MessageFlags, EmbedBuilder } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders")
const { JsonDatabase } = require("wio.db")
const { getCache } = require("../../../Functions/connect_api")
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("users-perm")
        .setDescription("Veja os usuários que tem permissão para usar minhas funções!")
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
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
        if (interaction.user.id !== getCache(null, 'owner')) {
            interaction.reply({ content: `❌ | Apenas o dono do bot pode executar esse comando.`, flags: MessageFlags.Ephemeral })
            return;
        }

        const getOption = interaction.options.getString("ação")

        let type = getCache(null, 'type')

        const permissionTicket = type?.Ticket?.status
        const permissionVendas = type?.Vendas?.status

        if (getOption == 'optionTicket') {
            if (permissionTicket === false) {
                interaction.reply({
                    content: `❌ | Você não possui o bot de ticket para utilizar esse comando.`,
                    flags: MessageFlags.Ephemeral
                })
                return
            } else {
                var perms = '';
                const mapPerms = dbPerms.all().filter(ticket => ticket.ID == "ticket")
                const users = mapPerms.map((t) => t.data)

                perms = Object.entries(users[0]).map(([key, value]) => `<@${value}>`).join('\n')
                const usersTotal = Object.entries(users[0]).length

                const embedUsers = new EmbedBuilder()
                    .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
                    .setTitle(`Permissões bot Ticket (${usersTotal})`)
                    .setDescription(`${perms || `❌ | Nenhum usuário encontrado.`}`)
                    .setColor(colorC !== "none" ? colorC : "#460580")
                await interaction.reply({
                    embeds: [embedUsers],
                    flags: MessageFlags.Ephemeral
                })
            }
        } else if (getOption == 'optionVendas') {
            if (permissionVendas === false) {
                return interaction.reply({
                    content: `❌ | Você não possui o bot de vendas para utilizar esse comando.`,
                    flags: MessageFlags.Ephemeral
                })
            } else {
                var perms = '';
                const mapPerms = dbPerms.all().filter(ticket => ticket.ID == "vendas")
                const users = mapPerms.map((t) => t.data)
                if(!users){
                    return interaction.reply({
                        content: `❌ | Nenhum usuário encontrado.`,
                        flags: MessageFlags.Ephemeral
                    })
                }

                if(!users[0]) {
                    return interaction.reply({
                        content: `❌ | Nenhum usuário encontrado.`,
                        flags: MessageFlags.Ephemeral
                    })
                }
                perms = Object.entries(users[0]).map(([key, value]) => `<@${value}>`).join('\n')
                const usersTotal = Object.entries(users[0]).length

                const embedUsers = new EmbedBuilder()
                    .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
                    .setTitle(`Permissões bot Vendas (${usersTotal})`)
                    .setDescription(`${perms || `❌ | Nenhum usuário encontrado.`}`)
                    .setColor(colorC !== "none" ? colorC : "#460580")
                await interaction.reply({
                    embeds: [embedUsers],
                    flags: MessageFlags.Ephemeral
                })
            }
        }
    },
}