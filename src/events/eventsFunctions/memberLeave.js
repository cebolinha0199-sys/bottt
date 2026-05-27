const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField } = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbDataTickets = new JsonDatabase({ databasePath: "./databases/data_ticket.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        try {
            const findTicket = dbDataTickets.all().filter(pd => pd.data.usuario === member.id)
            if (findTicket) {
                findTicket.map((pd) => {
                    const ticketCanal = pd.data.canal

                    member.guild.channels.cache.get(ticketCanal).edit({
                        name: `closed・saiu-do-servidor`,
                        permissionOverwrites: [
                            {
                                id: member.guild.id,
                                deny: [
                                    "ViewChannel",
                                    "SendMessages"
                                ],
                            }
                        ],
                    });

                    const canal = member.guild.channels.cache.get(pd.data.call)
                    if (canal) {
                        canal.delete()
                    }
                    let cargostaff = ''
                    const mapRoles = dbConfigs.all().filter(ticket => ticket.ID == "ticket")
                    const findRoles = mapRoles.map((t) => t.data.ticket.cargo_staff)
                    cargostaff = Object.entries(findRoles[0]).map(([key, value]) => `<@&${value}>`).join(' | ');

                    member.guild.channels.cache.get(ticketCanal).send({
                        content: `${cargostaff}`,
                        embeds: [
                            new EmbedBuilder()
                                .setDescription("O Dono do ticket saiu do servidor, clique no botão abaixo para finalizar o ticket")
                                .setColor(dbConfigs.get(`color`))
                        ],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId("ticket_finalizar")
                                        .setLabel("Finalizar Ticket")
                                        .setEmoji(dbConfigs.get(`painel.button.finalizar`))
                                        .setStyle(ButtonStyle.Danger),
                                )
                        ]
                    })
                })
            }
        } catch (error) {
            console.log(`Erro no evento MemberRemove: ` + error)
        }
    }
}