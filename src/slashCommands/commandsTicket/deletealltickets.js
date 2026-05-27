const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ActivityType, ApplicationCommandType, ApplicationCommandOptionType, PermissionFlagsBits, AttachmentBuilder, ComponentType } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders")
const { JsonDatabase } = require("wio.db")
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })
const dbDataTickets = new JsonDatabase({ databasePath: "./databases/data_ticket.json" })
const dbTickets = new JsonDatabase({ databasePath: "./databases/tickets.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const Discord = require("discord.js")
const { createTranscript } = require('discord-html-transcripts');
const { getCache } = require("../../../Functions/connect_api")

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delet-all-tickets")
        .setDescription("Delete todos os tickets abertos."),

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

        await interaction.reply({ content: `${dbEmojis.get(`16`)} | Aguarde um momento, isso pode demorar um pouco...`, flags: MessageFlags.Ephemeral })
        if (dbDataTickets.all().length <= 0) {
            interaction.editReply({ content: `${dbEmojis.get(`13`)} | Não existe nenhum ticket aberto!`, flags: MessageFlags.Ephemeral })
            return;
        }

        dbDataTickets.all().map(async (entry) => {
            await interaction.guild.channels.fetch()
            await interaction.guild.members.fetch()
            const ticketId = entry.data.canal
            const tickets = dbDataTickets.get(`${ticketId}`)
            const usuario = dbDataTickets.get(`${ticketId}.usuario`)
            const user = interaction.guild.members.cache.get(usuario) || 'Saiu do servidor'
            const motivo = dbDataTickets.get(`${ticketId}.motivo`)
            const codigo = dbDataTickets.get(`${ticketId}.codigo`)
            const logs = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.canal_logs`))
            const assumiu = interaction.guild.members.cache.get(dbDataTickets.get(`${ticketId}.staff`))

            await delay(2000)
            const channel = interaction.guild.channels.cache.get(ticketId)

            if (!channel) {
                try { dbDataTickets.delete(ticketId) } catch (err) { console.log(err.message) }
            } else {
                try {
                    channel.edit({
                        name: `🔒|closed・delete-all`,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [
                                    "ViewChannel",
                                    "SendMessages"
                                ],
                            }
                        ],
                    });
                    setTimeout(() => {
                        channel.delete().catch(error => { })
                    }, 30000)
                    if (!logs) return console.log("Canal Logs não configurado");

                    const file = await createTranscript(channel, {
                        filename: `transcript-${usuario}.html`
                    })

                    if (logs) {
                        await logs.send({
                            files: [file],
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(`${dbEmojis.get(`33`)} Sistema de Logs`)
                                    .setDescription([
                                        `${dbEmojis.get(`29`)} Usuário que abriu:`,
                                        `> ${user}`,
                                        `${dbEmojis.get(`29`)} Usuário que fechou:`,
                                        `> ${interaction.user}`,
                                        `${dbEmojis.get(`29`)} Quem assumiu:`,
                                        `> ${assumiu ?? `Ninguem Assumiu`}`,
                                        `${dbEmojis.get(`25`)} Código do Ticket:`,
                                        `\`${codigo}\``,
                                        `${dbEmojis.get(`27`)} Horário de abertura:`,
                                        `<t:${tickets.horario1}:f> <t:${tickets.horario2}:R>`,
                                        `${dbEmojis.get(`27`)} Horário do fechamento:`,
                                        `<t:${Math.floor(new Date() / 1000)}:f> (<t:${~~(new Date() / 1000)}:R>)`
                                    ].join('\n'))
                                    .setFooter({ text: `Veja as logs do ticket clicando no botão abaixo.` })
                            ],
                        })
                    }

                    if (user) {
                        user.send({
                            embeds: [
                                new Discord.EmbedBuilder()
                                    .setTitle(`${dbEmojis.get(`1`)} | SEU TICKET FOI FECHADO`)
                                    .addFields(
                                        {
                                            name: `${dbEmojis.get(`32`)} | Ticket aberto por:`,
                                            value: `${user}`,
                                            inline: false
                                        },
                                        {
                                            name: `${dbEmojis.get(`13`)} | Fechado por:`,
                                            value: `${interaction.user}`,
                                            inline: false
                                        },
                                        {
                                            name: `${dbEmojis.get(`24`)} | Quem Assumiu:`,
                                            value: `${assumiu ?? `Ninguem Assumiu`}`,
                                            inline: false
                                        },
                                        {
                                            name: `${dbEmojis.get(`25`)} | Motivo Ticket`,
                                            value: `\`${motivo}\``,
                                            inline: false
                                        },
                                        {
                                            name: `${dbEmojis.get(`27`)} | Horário do fechamento:`,
                                            value: `<t:${Math.floor(new Date() / 1000)}:f> (<t:${~~(new Date() / 1000)}:R>)`,
                                            inline: false
                                        }
                                    )
                            ],
                        })
                    }

                    const embed = new EmbedBuilder()
                        .setColor(dbConfigs.get(`ticket.color`))
                        .setTitle(`🎉 | O Ticket foi finalizado!`)
                        .setFields(
                            {
                                name: `${dbEmojis.get(`24`)} Staff que fechou:`,
                                value: `${interaction.user} - ${interaction.user.id}`,
                                inline: false
                            },
                            {
                                name: `${dbEmojis.get(`32`)} Usuário que abriu:`,
                                value: `${user} - ${usuario}`,
                                inline: false
                            },
                            {
                                name: `${dbEmojis.get(`1`)} Informações:`,
                                value: `Caso queira ver as logs do ticket clique no botão abaixo para conferir.`,
                                inline: false
                            }
                        )

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(5)
                                .setLabel(`Ir para às LOGS`)
                                .setURL(`${interaction.guild.channels.cache.get(dbConfigs.get(`ticket.canal_logs`)).url}`)
                        )

                    channel.send({ embeds: [embed], components: [row] })

                    const rowww = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(1)
                                .setCustomId(`${channel.id}_avalia_atendimentoo`)
                                .setLabel(`Avaliar Atendimento`)
                                .setEmoji(dbEmojis.get(`28`))
                        )
                    if (user) {
                        user.send({ components: [rowww] }).then(msg => {
                            setTimeout(() => {
                                msg.delete()
                            }, 1000 * 60 * 5);
                        })
                    }

                    interaction.editReply({ content: `✔ | Todos os ticket's foram fechados.` })
                } catch (err) {
                    interaction.editReply({ content: `❌ | Ocorreu um erro:\n \`\`\`${err.message}\`\`\`` })
                    console.error(`Erro no delet-all: ${err.message}`)
                }
            }
        })
    }
}