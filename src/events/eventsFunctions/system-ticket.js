const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder, ActivityType } = require("discord.js")
const { PermissionFlagsBits } = require('discord.js');
const { JsonDatabase } = require("wio.db")
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })
const dbDataTickets = new JsonDatabase({ databasePath: "./databases/data_ticket.json" })
const dbTickets = new JsonDatabase({ databasePath: "./databases/tickets.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const { createTranscript } = require('discord-html-transcripts');
const { getCache } = require("../../../Functions/connect_api");
const dbRankingTicket = new JsonDatabase({ databasePath: "./databases/dbRankingTicket.json" })

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        //Select Tipo Menu Ticket
        if (interaction.isStringSelectMenu() && interaction.customId === "select_ticket") {
            let type = getCache(null, 'type')
            if (type?.Ticket?.status !== true) {
                interaction.reply({ content: `❌ | Sistema de vendas desabilitado pois o plano não foi ativo.`, flags: MessageFlags.Ephemeral })
                return
            }


            const option = interaction.values[0];
            const tabom = option.split("_")[0];
            const tabom2 = option.split("_")[1];
            const paineis = dbTickets.get(`${tabom}.select`);

            paineis.map(async (entry, index) => {
                if (option.endsWith(`_${entry.id}`)) {
                    const getCategory = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`))
                    const getLogsChannel = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.canal_logs`))

                    const staffRoleIds = await dbConfigs.get('ticket.ticket.cargo_staff');
                    const staffRoles = Array.isArray(staffRoleIds) ? staffRoleIds : [staffRoleIds];
                    const invalidRoles = staffRoles.filter(roleID => !interaction.guild.roles.cache.has(roleID));

                    if (!getCategory) {
                        interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#ff0000')
                                    .setTitle(`${dbEmojis.get(`13`)} | Categoria Inválida`)
                                    .setDescription(`Configure o bot direito! Dê o comando \`/botconfig\` e vá em \`Principais\` e selecione a opção \`Categoria Ticket\`, coloque um id de uma categoria válida!`)
                            ], flags: MessageFlags.Ephemeral
                        })
                        return;
                    }
                    if (invalidRoles.length > 0) {
                        for (const roleID of invalidRoles) {
                            await dbConfigs.pull('ticket.ticket.cargo_staff', (storedRoleID) => storedRoleID === roleID);
                        }
                    }
                    if (!getLogsChannel) {
                        interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#ff0000')
                                    .setTitle(`${dbEmojis.get(`13`)} | Canal logs Inválido`)
                                    .setDescription(`Configure o bot direito! Dê o comando \`/botconfig\` e vá em \`Principais\` e selecione a opção \`Canal Logs\` e coloque um id de um canal válido!`)
                            ], flags: MessageFlags.Ephemeral
                        })
                        return;
                    }

                    const cleanUsername = interaction.user.username
                        .toLowerCase()
                        .replace(/[\s._]/g, "・");

                    const channel = interaction.guild.channels.cache.find((c) => c.name === `🎫・${cleanUsername}` && c.topic === interaction.user.id);

                    if (channel)
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(
                                        `${dbEmojis.get(`13`)} | ${interaction.user} Você já possui um ticket aberto em ${channel}.`
                                    ),
                            ],
                            components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setLabel("Ir para o seu Ticket")
                                            .setStyle(ButtonStyle.Link)
                                            .setURL(channel.url)
                                    ),
                            ],
                            flags: MessageFlags.Ephemeral,
                        });
                    const select = dbTickets.get(`${tabom}.select`)
                    const id = Number(tabom2) - 1
                    if (select[id].assunto === "ON" || dbTickets.get(`${tabom}.modal.assunto`) === "ON") {
                        const modal = new ModalBuilder()
                            .setCustomId(`${tabom}_${entry.id}_modal_ticket`)
                            .setTitle("DESCREVA O SEU TICKET!")

                        const text = new TextInputBuilder()
                            .setCustomId("motivo")
                            .setLabel("Descreva o motivo do ticket")
                            .setPlaceholder("Digite aqui")
                            .setStyle(1)
                        modal.addComponents(new ActionRowBuilder().addComponents(text))

                        if (select[id].desc === "ON" || dbTickets.get(`${tabom}.modal.desc`) === "ON") {
                            const text2 = new TextInputBuilder()
                                .setCustomId("desc")
                                .setLabel("Descreva os detalhes do ticket")
                                .setPlaceholder("Digite aqui")
                                .setStyle(2)
                                .setRequired(false)

                            modal.addComponents(new ActionRowBuilder().addComponents(text2))
                        }
                        return interaction.showModal(modal)
                    } else {
                        const motivo = "Não Escrito"
                        const permissionOverwrites = [
                            {
                                id: interaction.guild.id,
                                deny: ["ViewChannel"],
                            },
                            {
                                id: interaction.user.id,
                                allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                            }
                        ];

                        const awaitOpenTicket = await interaction.reply({
                            content: `Seu Ticket está sendo aberto, aguarde...`,
                            flags: MessageFlags.Ephemeral
                        })

                        let categoria = "";

                        if (dbTickets.get(`${tabom}.tipo`) === "button") {
                            if (dbTickets.get(`${tabom}.categoria`)) {
                                categoria = dbTickets.get(`${tabom}.categoria`)
                            } else {
                                categoria = dbConfigs.get(`ticket.ticket.categoria`)
                            }
                        }
                        if (dbTickets.get(`${tabom}.tipo`) === "select") {
                            let selectArray = dbTickets.get(`${tabom}.select`) || [];

                            const elementIndex = selectArray.findIndex(element => element.id === Number(tabom2));

                            if (elementIndex !== -1) {
                                if (selectArray[elementIndex].categoria) {
                                    categoria = selectArray[elementIndex].categoria
                                } else {
                                    categoria = dbConfigs.get(`ticket.ticket.categoria`)
                                }
                            }
                        }
                        const getCategory = await interaction.guild.channels.cache.get(categoria)
                        if (!getCategory) {
                            awaitOpenTicket.edit({
                                content: ``, embeds: [
                                    new EmbedBuilder()
                                        .setColor('#ff0000')
                                        .setTitle(`${dbEmojis.get(`13`)} | Categoria Inválida`)
                                        .setDescription(`Configure o bot direito! Dê o comando \`/botconfig\` e vá em \`Principais\` e selecione a opção \`Categoria Ticket\`, coloque um id de uma categoria válida!`)
                                ], flags: MessageFlags.Ephemeral
                            })
                            return;
                        }

                        await interaction.guild.channels.create({
                            name: `🎫・${interaction.user.username}`,
                            type: 0,
                            parent: categoria,
                            topic: interaction.user.id,
                            permissionOverwrites: permissionOverwrites,
                        }).then(async (channels) => {
                            awaitOpenTicket.edit({
                                content: `${dbEmojis.get(`6`)} | ${interaction.user} Seu Ticket foi aberto no canal: ${channels}`,
                                components: [
                                    new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setStyle(5)
                                                .setURL(channels.url)
                                                .setLabel("Ir para o ticket")
                                        )
                                ], flags: MessageFlags.Ephemeral
                            })
                            const getTicketCode = channels.id
                            const user = interaction.user

                            dbDataTickets.set(`${channels.id}`, {
                                usuario: user.id,
                                motivo: motivo,
                                desc: "Não Escrito",
                                painel: tabom,
                                idPainel: tabom2,
                                users: [],
                                codigo: getTicketCode,
                                category: categoria,
                                horario1: `${Math.floor(new Date() / 1000)}`,
                                horario2: `${~~(new Date() / 1000)}`,
                                staff: "Ninguem Assumiu",
                                canal: channels.id,
                                logsUsers: []
                            })

                            const rolesStaff = dbConfigs.get('ticket.ticket.cargo_staff')
                            if (rolesStaff) {
                                const currentPermissions = channels.permissionOverwrites.cache;

                                for (const rolesID of rolesStaff) {
                                    const role = await interaction.guild.roles.fetch(rolesID);
                                    let currentRolePermissions = currentPermissions.get(role.id);
                                    const newPermissions = {
                                        [PermissionFlagsBits.ViewChannel]: true,
                                        [PermissionFlagsBits.SendMessages]: true,
                                        [PermissionFlagsBits.Connect]: true
                                    };

                                    if (currentRolePermissions) {
                                        await channels.permissionOverwrites.edit(role, newPermissions);
                                    } else {
                                        await channels.permissionOverwrites.create(role, newPermissions);
                                    }
                                }
                            }

                            let desc = `${dbConfigs.get(`ticket.painel.desc`)}`;
                            desc = desc.replace(`{codigo}`, interaction.channel.id);
                            desc = desc.replace(`{motivo}`, `${dbDataTickets.get(`${channels.id}.motivo`,)}`);
                            desc = desc.replace(`{desc}`, `${dbDataTickets.get(`${channels.id}.desc`,)}`);
                            desc = desc.replace(`{assumido}`, `${dbDataTickets.get(`${channels.id}.staff`,)}`);
                            desc = desc.replace(`{user}`, `<@${dbDataTickets.get(`${channels.id}.usuario`)}>`);
                            desc = desc.replace(`{horario2}`, `<t:${dbDataTickets.get(`${channels.id}.horario2`)}:R>`);
                            desc = desc.replace(`{horario1}`, `<t:${dbDataTickets.get(`${channels.id}.horario1`)}:f>`);

                            const embeds = new EmbedBuilder()
                                .setDescription(desc)

                            const messageToFix = await channels.send({
                                content: `# TICKET - ${dbDataTickets.get(`${channels.id}.codigo`)}\n${user}`,
                                embeds: [
                                    embeds
                                ],
                                components: [
                                    new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId("sairdoticket")
                                                .setLabel("Sair do ticket")
                                                .setEmoji(dbConfigs.get(`ticket.painel.button.sair`) || '💨')
                                                .setStyle(ButtonStyle.Danger),
                                            new ButtonBuilder()
                                                .setCustomId("painel_member")
                                                .setLabel("Painel Membro")
                                                .setEmoji(dbConfigs.get(`ticket.painel.button.membro`) || '🧮')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId("painel_staff")
                                                .setLabel("Painel Staff")
                                                .setEmoji(dbConfigs.get(`ticket.painel.button.staff`) || '📑')
                                                .setStyle(2),
                                            new ButtonBuilder()
                                                .setCustomId("ticket_assumir")
                                                .setLabel("Assumir Ticket")
                                                .setEmoji(dbConfigs.get(`ticket.painel.button.assumir`) || '🔨')
                                                .setStyle(3),
                                            new ButtonBuilder()
                                                .setCustomId("ticket_finalizar")
                                                .setLabel("Finalizar Ticket")
                                                .setEmoji(dbConfigs.get(`ticket.painel.button.finalizar`) || '🧨')
                                                .setStyle(ButtonStyle.Danger),
                                        )
                                ]
                            })

                            await messageToFix.pin()

                            const chanal = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.canal_logs`))
                            if (!chanal) return;
                            chanal.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setDescription(`${dbEmojis.get(`1`)} TICKET **${getTicketCode}** aberto por **${user.username}**, para acessar **[CLIQUE AQUI](${channels.url})**`)
                                        .setColor(dbConfigs.get(`ticket.color`) || 'Aqua')
                                ]
                            })

                            if (dbTickets.get(`${tabom}.tipo`) === "select") {
                                const buttons = dbTickets.get(`${tabom}.select`)
                                const id = Number(tabom2) - 1

                                if (buttons[id].msg.sistema === "ON") {
                                    const desc = `${buttons[id].msg.mensagem}`;
                                    channels.send(`${desc || `Olá ${interaction.user} 👋. Por favor, adiante o **ASSUNTO** que você gostaria de discutir no ticket. Caso você não relate o assunto nós **FECHAREMOS O TICKET** depois de algum tempo.`}`)
                                }
                            }
                        })
                    }
                }
            })
        }

        if (interaction.isButton()) {
            const customId = interaction.customId;
            const tabom = customId.split("_")[1]
            const tabom2 = Number(customId.split("_")[0])
            //console.log(tabom, tabom2)
            if (customId.endsWith(`${dbTickets.get(`${tabom}.idpainel`)}`)) {
                //console.log(1)
                let type = getCache(null, 'type')
                if (type?.Ticket?.status !== true) {
                    interaction.reply({ content: `❌ | Sistema de ticket desabilitado pois o plano não foi ativo.`, flags: MessageFlags.Ephemeral })
                    return
                }

                const getCategory = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`))
                const getLogChannel = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.canal_logs`))

                const staffRoleIds = await dbConfigs.get('ticket.ticket.cargo_staff');
                const staffRoles = Array.isArray(staffRoleIds) ? staffRoleIds : [staffRoleIds];
                const invalidRoles = staffRoles.filter(roleID => !interaction.guild.roles.cache.has(roleID));

                if (!getCategory) {
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#ff0000')
                                .setTitle(`${dbEmojis.get(`13`)} | Categoria Inválida`)
                                .setDescription(`Configure o bot direito! Dê o comando \`/botconfig\` e vá em \`Principais\` e selecione a opção \`Categoria Ticket\`, coloque um id de uma categoria válida!`)
                        ], flags: MessageFlags.Ephemeral
                    })
                    return;
                }
                if (invalidRoles.length > 0) {
                    for (const roleID of invalidRoles) {
                        await dbConfigs.pull('ticket.ticket.cargo_staff', (storedRoleID) => storedRoleID === roleID);
                    }
                }
                if (!getLogChannel) {
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#ff0000')
                                .setTitle(`${dbEmojis.get(`13`)} | Canal logs Inválido`)
                                .setDescription(`Configure o bot direito! Dê o comando \`/botconfig\` e vá em \`Principais\` e selecione a opção \`Canal Logs\` e coloque um id de um canal válido!`)
                        ], flags: MessageFlags.Ephemeral
                    })
                    return;
                }
                const cleanUsername = interaction.user.username
                    .toLowerCase()
                    .replace(/[\s._]/g, "・");

                const channel = interaction.guild.channels.cache.find(
                    (c) => c.name === `🎫・${cleanUsername}`
                );

                if (channel)
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(
                                    `${dbEmojis.get(`13`)} | ${interaction.user} Você já possui um ticket aberto em ${channel}.`
                                ),
                        ],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setLabel("Ir para o seu Ticket")
                                        .setStyle(ButtonStyle.Link)
                                        .setURL(channel.url)
                                ),
                        ],
                        flags: MessageFlags.Ephemeral,
                    });
                const buttons = dbTickets.get(`${tabom}.buttons`)
                const id = Number(tabom2) - 1
                const getAssunto = await dbTickets.get(`${tabom}.modal.assunto`) || null

                if (buttons[id].assunto === "ON" || getAssunto === "ON") {

                    const modal = new ModalBuilder().setCustomId(`${tabom}_${tabom2}_modal_ticket`).setTitle("Descreva o motivo do ticket")

                    const text = new TextInputBuilder()
                        .setCustomId("motivo")
                        .setLabel("Descreva o motivo do ticket")
                        .setPlaceholder("Digite aqui")
                        .setStyle(1)

                    modal.addComponents(new ActionRowBuilder().addComponents(text))
                    if (buttons[id].desc === "ON" || dbTickets.get(`${tabom}.modal.desc`) === "ON") {
                        const text2 = new TextInputBuilder()
                            .setCustomId("desc")
                            .setLabel("Descreva os detalhes do ticket")
                            .setPlaceholder("Digite aqui")
                            .setStyle(2)
                            .setRequired(false)

                        modal.addComponents(new ActionRowBuilder().addComponents(text2))
                    }
                    return interaction.showModal(modal)
                } else {
                    const motivo = "Não Escrito"
                    const permissionOverwrites = [
                        {
                            id: interaction.guild.id,
                            deny: ["ViewChannel"],
                        },
                        {
                            id: interaction.user.id,
                            allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                        }
                    ];

                    const msggg = await interaction.reply({
                        content: `Seu Ticket está sendo aberto, aguarde...`,
                        flags: MessageFlags.Ephemeral
                    })

                    let categoria = "";

                    if (dbTickets.get(`${tabom}.tipo`) === "button") {
                        let buttons = []
                        const id = Number(tabom2) - 1
                        buttons = dbTickets.get(`${tabom}.buttons`)[id]

                        if (await buttons.categoria) {
                            categoria = await buttons.categoria
                        } else {
                            categoria = await dbConfigs.get(`ticket.ticket.categoria`)
                        }
                    }
                    const palmito = await interaction.guild.channels.cache.get(categoria)
                    if (!palmito) {
                        msggg.edit({
                            content: ``, embeds: [
                                new EmbedBuilder()
                                    .setColor('#ff0000')
                                    .setTitle(`${dbEmojis.get(`13`)} | Categoria Inválida`)
                                    .setDescription(`Configure o bot direito! Dê o comando \`/botconfig\` e vá em \`Principais\` e selecione a opção \`Categoria Ticket\`, coloque um id de uma categoria válida!`)
                            ], flags: MessageFlags.Ephemeral
                        })
                        return;
                    }
                    await interaction.guild.channels.create({
                        name: `🎫・${interaction.user.username}`,
                        type: 0,
                        parent: categoria,
                        topic: interaction.user.id,
                        permissionOverwrites: permissionOverwrites,
                    }).then(async (channels) => {
                        msggg.edit({
                            content: `${dbEmojis.get(`6`)} | ${interaction.user} Seu Ticket foi aberto no canal: ${channels.url}`,
                            components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(5)
                                            .setURL(channels.url)
                                            .setLabel("Ir para o ticket")
                                    )
                            ], flags: MessageFlags.Ephemeral
                        })

                        const aaaaa = channels.id
                        const user = interaction.user

                        dbDataTickets.set(`${channels.id}`, {
                            usuario: user.id,
                            motivo: motivo,
                            desc: "Não Escrito",
                            painel: tabom,
                            idPainel: tabom2,
                            codigo: aaaaa,
                            users: [],
                            category: categoria,
                            idbutton: Number(tabom2),
                            horario1: `${Math.floor(new Date() / 1000)}`,
                            horario2: `${~~(new Date() / 1000)}`,
                            staff: "Ninguem Assumiu",
                            canal: channels.id,
                            logsUsers: []
                        })

                        let desc = `${dbConfigs.get(`ticket.painel.desc`)}`;
                        desc = desc.replace(`{codigo}`, aaaaa);
                        desc = desc.replace(`{motivo}`, `${dbDataTickets.get(`${channels.id}.motivo`,)}`);
                        desc = desc.replace(`{desc}`, `${dbDataTickets.get(`${channels.id}.desc`,)}`);
                        desc = desc.replace(`{assumido}`, `${dbDataTickets.get(`${channels.id}.staff`,)}`);
                        desc = desc.replace(`{user}`, `<@${dbDataTickets.get(`${channels.id}.usuario`)}>`);
                        desc = desc.replace(`{horario2}`, `<t:${dbDataTickets.get(`${channels.id}.horario2`)}:R>`);
                        desc = desc.replace(`{horario1}`, `<t:${dbDataTickets.get(`${channels.id}.horario1`)}:f>`);

                        const embeds = new EmbedBuilder()
                            .setDescription(desc)

                        const messageToFix = await channels.send({
                            content: `# TICKET - ${dbDataTickets.get(`${channels.id}.codigo`)}\n${user}`,
                            embeds: [
                                embeds
                            ],
                            components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("sairdoticket")
                                            .setLabel("Sair do ticket")
                                            .setEmoji(dbConfigs.get(`ticket.painel.button.sair`) || '💨')
                                            .setStyle(ButtonStyle.Danger),
                                        new ButtonBuilder()
                                            .setCustomId("painel_member")
                                            .setLabel("Painel Membro")
                                            .setEmoji(dbConfigs.get(`ticket.painel.button.membro`) || '🧮')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId("painel_staff")
                                            .setLabel("Painel Staff")
                                            .setEmoji(dbConfigs.get(`ticket.painel.button.staff`) || '📑')
                                            .setStyle(2),
                                        new ButtonBuilder()
                                            .setCustomId("ticket_assumir")
                                            .setLabel("Assumir Ticket")
                                            .setEmoji(dbConfigs.get(`ticket.painel.button.assumir`) || '🔨')
                                            .setStyle(3),
                                        new ButtonBuilder()
                                            .setCustomId("ticket_finalizar")
                                            .setLabel("Finalizar Ticket")
                                            .setEmoji(dbConfigs.get(`ticket.painel.button.finalizar`) || '🧨')
                                            .setStyle(ButtonStyle.Danger),
                                    )
                            ]
                        })

                        await messageToFix.pin()

                        const chanal = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.canal_logs`))
                        if (!chanal) return;
                        chanal.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`${dbEmojis.get(`1`)} TICKET **${aaaaa}** aberto por **${user.username}**, para acessar **[CLIQUE AQUI](${channels.url})**`)
                                    .setColor(dbConfigs.get(`ticket.color`) || 'Aqua')
                            ]
                        })

                        const rolesStaff = dbConfigs.get('ticket.ticket.cargo_staff')
                        if (rolesStaff) {
                            const currentPermissions = channels.permissionOverwrites.cache;

                            for (const rolesID of rolesStaff) {
                                const role = await interaction.guild.roles.fetch(rolesID);
                                let currentRolePermissions = currentPermissions.get(role?.id);
                                const newPermissions = {
                                    [PermissionFlagsBits.ViewChannel]: true,
                                    [PermissionFlagsBits.SendMessages]: true,
                                    [PermissionFlagsBits.Connect]: true
                                };

                                if (currentRolePermissions) {
                                    await channels.permissionOverwrites.edit(role, newPermissions);
                                } else {
                                    await channels.permissionOverwrites.create(role, newPermissions);
                                }
                            }
                        }

                        if (dbTickets.get(`${tabom}.tipo`) === "button") {
                            const buttons = dbTickets.get(`${tabom}.buttons`)
                            const id = Number(tabom2) - 1

                            if (buttons[id].msg.sistema === "ON") {
                                let desc = `${buttons[id].msg.mensagem}`;
                                desc = desc.replace(`{codigo}`, interaction.channel.id);
                                desc = desc.replace(`{motivo}`, `${dbDataTickets.get(`${channels.id}.motivo`,)}`);
                                desc = desc.replace(`{desc}`, `${dbDataTickets.get(`${channels.id}.desc`,)}`);
                                desc = desc.replace(`{assumido}`, `${dbDataTickets.get(`${channels.id}.staff`,)}`);
                                desc = desc.replace(`{user}`, `<@${dbDataTickets.get(`${channels.id}.usuario`)}>`);
                                desc = desc.replace(`{horario2}`, `<t:${dbDataTickets.get(`${channels.id}.horario2`)}:R>`);
                                desc = desc.replace(`{horario1}`, `<t:${dbDataTickets.get(`${channels.id}.horario1`)}:f>`);
                                channels.send(`${desc || `Olá ${interaction.user} 👋. Por favor, adiante o **ASSUNTO** que você gostaria de discutir no ticket. Caso você não relate o assunto nós **FECHAREMOS O TICKET** depois de algum tempo.`}`)
                            }
                        }
                    }).catch(error => {
                        try {
                            if (error.message === 'Maximum number of channels in category reached (50)') {
                                msggg.edit({ content: '❗ | O limite de tickets foi atingido, por favor avise a staff!', flags: MessageFlags.Ephemeral })
                            } else {
                                console.error(error.message)
                            }
                        } catch (err) {
                            console.log(err.message)
                        }
                    })
                }
            }
        }

        //Assumit Ticket
        if (interaction.customId === "ticket_assumir") {
            const usuario = dbDataTickets.get(`${interaction.channel.id}.usuario`)
            await interaction.guild.members.fetch(usuario)
            const user = interaction.guild.members.cache.get(usuario)

            const user1 = await interaction.guild.members.fetch(interaction.user.id);
            const rolesArrayFind = await dbConfigs.get(`ticket.ticket.cargo_staff`);
            const roleIdToCheck = await user1.roles.cache.some(role => rolesArrayFind.includes(role.id))
            const hasRequiredRole = roleIdToCheck || user1.permissions.has(PermissionsBitField.Flags.Administrator)

            if (!hasRequiredRole) {
                await interaction.reply({ content: 'Você não tem permissão para usar este botão.', flags: MessageFlags.Ephemeral });
                return;
            }

            await dbDataTickets.set(`${interaction.channel.id}.staff`, interaction.user.id)

            user.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                        .setTitle(`Ticket | Assumido`)
                        .setDescription(`${dbEmojis.get("31")} | Olá ${user}. O staff ${interaction.user} assumiu o seu ticket! Clique no botão abaixo para ir até ele.`)
                        .setColor(dbConfigs.get(`ticket.color`) || 'Aqua')
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel(`Ir para o Ticket`)
                                .setStyle(5)
                                .setURL(interaction.channel.url)
                        )
                ]
            }).catch(err => { })

            const embed = new EmbedBuilder()
                .setDescription(`Olá ${user}, seu ticket foi assumido por ${interaction.user}! Dê continuidade ao atendimento.`)
                .setColor(dbConfigs.get(`ticket.color`) || 'Aqua')

            interaction.channel.send({ content: `${user}`, embeds: [embed] }).then(msg => {
                setTimeout(() => {
                    msg.delete().catch(err => { })
                }, 10000);
            })

            let desc = `${dbConfigs.get(`ticket.painel.desc`)}`;
            desc = desc.replace(`{codigo}`, `${dbDataTickets.get(`${interaction.channel.id}.codigo`)}`);
            desc = desc.replace(`{motivo}`, `${dbDataTickets.get(`${interaction.channel.id}.motivo`)}`);
            desc = desc.replace(`{desc}`, `${dbDataTickets.get(`${interaction.channel.id}.desc`,)}`);
            desc = desc.replace(`{assumido}`, `<@${dbDataTickets.get(`${interaction.channel.id}.staff`,)}>`);
            desc = desc.replace(`{user}`, `<@${dbDataTickets.get(`${interaction.channel.id}.usuario`)}>`);
            desc = desc.replace(`{horario2}`, `<t:${dbDataTickets.get(`${interaction.channel.id}.horario2`)}:R>`);
            desc = desc.replace(`{horario1}`, `<t:${await dbDataTickets.get(`${interaction.channel.id}.horario1`)}:f>`);

            const embeds = new EmbedBuilder()
                .setDescription([
                    `${desc}`
                ].join('\n'))

            await interaction.update({
                embeds: [embeds],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("sairdoticket")
                                .setLabel("Sair do ticket")
                                .setEmoji(dbConfigs.get(`ticket.painel.button.sair`) || '💨')
                                .setStyle(ButtonStyle.Danger),
                            new ButtonBuilder()
                                .setCustomId("painel_member")
                                .setLabel("Painel Membro")
                                .setEmoji(dbConfigs.get(`ticket.painel.button.membro`) || '🧮')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId("painel_staff")
                                .setLabel("Painel Staff")
                                .setEmoji(dbConfigs.get(`ticket.painel.button.staff`) || '📑')
                                .setStyle(2),
                            new ButtonBuilder()
                                .setCustomId("ticket_assumir")
                                .setLabel("Assumir Ticket")
                                .setEmoji(dbConfigs.get(`ticket.painel.button.assumir`) || '🔨')
                                .setStyle(3)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId("ticket_finalizar")
                                .setLabel("Finalizar Ticket")
                                .setEmoji(dbConfigs.get(`ticket.painel.button.finalizar`) || '🧨')
                                .setStyle(ButtonStyle.Danger),
                        )
                ]
            })

            const hasDB = await dbRankingTicket.get(`${interaction.user.id}.assumidos`) || 0
            await dbRankingTicket.set(`${interaction.user.id}.assumidos`, hasDB + 1)
        }

        //Função Finalizar Ticket
        if (interaction.customId === "sairdoticket") {
            const tickets = await dbDataTickets.get(`${interaction.channel.id}`)
            const user = tickets.usuario
            const painelId = tickets.painel
            if (user !== interaction.user.id) {
                interaction.reply({
                    content: `Esse botão só pode ser usado pelo dono do ticket. <@${user}>`,
                    flags: MessageFlags.Ephemeral
                })
                return;
            }

            interaction.channel.edit({
                name: `closed・${interaction.user.username}`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [
                            "ViewChannel",
                            "SendMessages"
                        ],
                    },
                    {
                        id: interaction.user.id,
                        deny: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                        ],
                    }
                ],
            });
            const canal = interaction.guild.channels.cache.get(await dbDataTickets.get(`${interaction.channel.id}.call`))
            if (canal) {
                canal.delete()
            }

            let cargostaff = ''
            const mapRoles = dbConfigs.all().filter(ticket => ticket.ID == "ticket")
            const findRoles = mapRoles.map((t) => t.data.ticket.cargo_staff)
            cargostaff = Object.entries(findRoles[0]).map(([key, value]) => `<@&${value}>`).join(' | ');

            interaction.reply({
                content: `${cargostaff}`,
                embeds: [
                    new EmbedBuilder()
                        .setDescription("O Dono do ticket saiu, clique no botão abaixo para finalizar o ticket")
                        .setColor(dbConfigs.get(`ticket.color`) || 'Aqua')
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("ticket_finalizar")
                                .setLabel("Finalizar Ticket")
                                .setEmoji(dbConfigs.get(`ticket.painel.button.finalizar`) || '🧨')
                                .setStyle(ButtonStyle.Danger),
                        )
                ]
            })
        }

        if (interaction.customId === "ticket_finalizar") {
            const tickets = dbDataTickets.get(`${interaction.channel.id}`)
            if (!tickets) {
                await interaction.reply({ content: `❕ | As informações desse ticket não foram encontradas no banco de dados, portanto não será possível gerar os logs corretamente e o canal será apenas deletado!` })
                setTimeout(() => {
                    interaction.channel.delete().catch(error => { })
                }, 15000);
                return
            }

            const usuario = dbDataTickets.get(`${interaction.channel.id}.usuario`)
            const user = await interaction.guild.members.fetch(usuario)
            const motivo = dbDataTickets.get(`${interaction.channel.id}.motivo`)
            const codigo = dbDataTickets.get(`${interaction.channel.id}.codigo`)
            const logs = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.canal_logs`))
            const assumiu = interaction.guild.members.cache.get(tickets.staff)
            const painelId = tickets.painel

            const user1 = await interaction.guild.members.fetch(interaction.user.id);
            const rolesArrayFind = await dbConfigs.get(`ticket.ticket.cargo_staff`);
            const roleIdToCheck = await user1.roles.cache.some(role => rolesArrayFind.includes(role.id))
            const hasRequiredRole = roleIdToCheck || user1.permissions.has(PermissionsBitField.Flags.Administrator)

            if (!hasRequiredRole) {
                await interaction.reply({ content: 'Você não tem permissão para usar este botão.', flags: MessageFlags.Ephemeral });
                return;
            }
            const buttons = dbTickets.get(`${painelId}.buttons`)
            const id = Number(tickets.idbutton) - 1
            if (dbTickets.get(`${painelId}.tipo`) === "button") {
                if (buttons[id].finaliza === "ON" || dbTickets.get(`${painelId}.modal.finaliza`) === "ON") {
                    const modal = new ModalBuilder()
                        .setCustomId(`motivo_finaliza_ticket`)
                        .setTitle("DESCREVA O MOTIVO DA FINALIZAÇÃO")

                    const text = new TextInputBuilder()
                        .setCustomId("motivo")
                        .setLabel("Descreva o motivo da finalização do ticket")
                        .setPlaceholder("Digite aqui")
                        .setStyle(1)
                    modal.addComponents(new ActionRowBuilder().addComponents(text))

                    await interaction.showModal(modal)
                    return;
                }
            } else {
                const select = dbTickets.get(`${painelId}.select`)
                const id = Number(tickets.idPainel) - 1
                if (select[id].finaliza === "ON" || dbTickets.get(`${painelId}.modal.finaliza`) === "ON") {
                    const modal = new ModalBuilder()
                        .setCustomId(`motivo_finaliza_ticket`)
                        .setTitle("DESCREVA O MOTIVO DA FINALIZAÇÃO")

                    const text = new TextInputBuilder()
                        .setCustomId("motivo")
                        .setLabel("Descreva o motivo da finalização do ticket")
                        .setPlaceholder("Digite aqui")
                        .setStyle(1)
                    modal.addComponents(new ActionRowBuilder().addComponents(text))

                    await interaction.showModal(modal)
                    return;
                }
            }

            interaction.channel.edit({
                name: `closed・${user?.user.username || 'saiu-do-servidor'}`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [
                            "ViewChannel",
                            "SendMessages"
                        ],
                    },
                    {
                        id: interaction.user.id,
                        deny: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                        ],
                    }
                ],
            });

            setTimeout(() => {
                try { interaction.channel.delete() } catch (error) { }
            }, 30000)

            setTimeout(() => {
                try { dbDataTickets.delete(`${interaction.channel.id}`) } catch (error) { }
            }, 120000)

            const canal = interaction.guild.channels.cache.get(await dbDataTickets.get(`${interaction.channel.id}.call`))

            if (canal) {
                canal.delete()
            }

            const file = await createTranscript(interaction.channel, {
                limit: -1,
                filename: `transcript-${await dbDataTickets.get(`${interaction.channel.id}.usuario`)}.html`,
                saveImages: true
            })

            const msg = await logs.send({ files: [file] })

            if (logs) {
                logs.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${dbEmojis.get(`33`)} Sistema de Logs`)
                            .setDescription([
                                `${dbEmojis.get(`29`)} Usuário que abriu:`,
                                `> ${user || `<@${usuario}> (saiu do servidor)`}`,
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
                            .addFields(
                                { name: `Baixe as logs para verificar o que foi feito.`, value: `[CLIQUE AQUI](${msg.url}) para ir para o transcript desse ticket.` }
                            )
                    ],
                })
            }

            if (user) {
                const embed = new EmbedBuilder()
                    .setTitle(`${dbEmojis.get(`1`)} | SEU TICKET FOI FECHADO`)
                    .setColor("Random")
                if (tickets.motivo === "Não Escrito") {
                    embed.addFields(
                        {
                            name: `${dbEmojis.get(`32`)} | Ticket aberto por:`,
                            value: `> ${user || `<@${usuario}> (saiu do servidor)`}`,
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
                    )
                } else {
                    embed.addFields(
                        {
                            name: `${dbEmojis.get(`32`)} | Ticket aberto por:`,
                            value: `> ${user || `<@${usuario}> (saiu do servidor)`}`,
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
                    )
                }
                const buttons = dbTickets.get(`${painelId}.buttons`)
                const id = Number(tickets.idbutton) - 1

                try {
                    if (buttons[id].finaliza === "ON" || dbTickets.get(`${painelId}.modal.finaliza`) === "ON") {
                        embed.addFields(
                            {
                                name: `${dbEmojis.get(`25`)} | Motivo Finalização`,
                                value: `\`${motivo}\``,
                                inline: false
                            },
                        )
                    }
                } catch (error) { }

                embed.addFields(
                    {
                        name: `${dbEmojis.get(`27`)} | Horário do fechamento:`,
                        value: `<t:${Math.floor(new Date() / 1000)}:f> (<t:${~~(new Date() / 1000)}:R>)`,
                        inline: false
                    }
                )
                user.send({
                    embeds: [embed],
                }).catch(error => { })
            }

            const embed = new EmbedBuilder()
                .setColor(dbConfigs.get(`ticket.color`) || 'Aqua')
                .setTitle(`🎉 | O Ticket foi finalizado!`)
                .setFields(
                    {
                        name: `${dbEmojis.get(`24`)} Staff que fechou:`,
                        value: `${interaction.user} - ${interaction.user.id}`,
                        inline: false
                    },
                    {
                        name: `${dbEmojis.get(`32`)} Usuário que abriu:`,
                        value: `${user || 'Saiu do servidor'} - ${user?.id || 'ID indisponível'}`,
                        inline: false
                    },
                    {
                        name: `${dbEmojis.get(`1`)} Informações:`,
                        value: `Caso queira ver as logs do ticket clique no botão abaixo para conferir.`,
                        inline: false
                    }
                )
            interaction.reply({ embeds: [embed] })

            const rowww = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(1)
                        .setCustomId(`${interaction.channel.id}_avalia_atendimentoo`)
                        .setLabel(`Avaliar Atendimento`)
                        .setEmoji(dbEmojis.get(`28`))
                )
            if (user) {
                user.send({ components: [rowww] }).then(msg => {
                    setTimeout(() => {
                        msg.delete()
                    }, 120000);
                }).catch(error => { })
            } else if (!user) {
                interaction.channel.send({ content: `${dbEmojis.get(`2`) || '❗'} | O autor desse ticket não se encontra mais no servidor.` })
            }



            const hasDB = await dbRankingTicket.get(`${interaction.user.id}.finalizados`) || 0
            await dbRankingTicket.set(`${interaction.user.id}.finalizados`, hasDB + 1)

            const channel = await client.channels.fetch(interaction.channel.id);
            let messages;
            let lastMessageId;
            const userMessageCount = {};

            do {
                messages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
                messages.forEach(async message => {
                    if (!message.author.bot && message.author.id != usuario) {
                        const userId = message.author.id;
                        userMessageCount[userId] = (userMessageCount[userId] || 0) + 1;
                    }
                });
                lastMessageId = messages.size > 0 ? messages.last().id : null;
            } while (messages.size > 0);
            for (const [userId, count] of Object.entries(userMessageCount)) {
                const user = await client.users.fetch(userId);
                const hasMessages = await dbRankingTicket.get(`${user.id}.messages`) || 0
                await dbRankingTicket.set(`${user.id}.messages`, hasMessages + count)
            }
        }

        if (interaction.isModalSubmit() && interaction.customId === "motivo_finaliza_ticket") {
            const tickets = dbDataTickets.get(`${interaction.channel.id}`)
            const usuario = dbDataTickets.get(`${interaction.channel.id}.usuario`)
            const motivof = interaction.fields.getTextInputValue("motivo");
            const user = interaction.guild.members.cache.get(usuario)
            const motivo = dbDataTickets.get(`${interaction.channel.id}.motivo`)
            const codigo = dbDataTickets.get(`${interaction.channel.id}.codigo`)
            const logs = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.canal_logs`))
            const assumiu = interaction.guild.members.cache.get(tickets.staff)
            const painelId = tickets.painel

            const user1 = await interaction.guild.members.fetch(interaction.user.id);
            const rolesArrayFind = await dbConfigs.get(`ticket.ticket.cargo_staff`);
            const roleIdToCheck = await user1.roles.cache.some(role => rolesArrayFind.includes(role.id))
            const hasRequiredRole = roleIdToCheck || user1.permissions.has(PermissionsBitField.Flags.Administrator)

            if (!hasRequiredRole) {
                await interaction.reply({ content: 'Você não tem permissão para usar este botão.', flags: MessageFlags.Ephemeral });
                return;
            }

            interaction.channel.edit({
                name: `closed・${user?.user.username || 'saiu-do-servidor'}`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [
                            "ViewChannel",
                            "SendMessages"
                        ],
                    },
                    {
                        id: interaction.user.id,
                        deny: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                        ],
                    }
                ],
            });

            setTimeout(async () => {
                await interaction.channel.delete().catch(err => { })
            }, 30000)

            const file = await createTranscript(interaction.channel, {
                limit: -1,
                filename: `transcript-${await dbDataTickets.get(`${interaction.channel.id}.usuario`)}.html`,
                saveImages: true
            })

            const msg = await logs.send({ files: [file] })

            if (logs) {
                logs.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${dbEmojis.get(`33`)} Sistema de Logs`)
                            .setDescription([
                                `${dbEmojis.get(`29`)} Usuário que abriu:`,
                                `> ${user || `<@${usuario}> (saiu do servidor)`}`,
                                `${dbEmojis.get(`29`)} Usuário que fechou:`,
                                `> ${interaction.user}`,
                                `${dbEmojis.get(`29`)} Quem assumiu:`,
                                `> ${assumiu ?? `Ninguem Assumiu`}`,
                                `${dbEmojis.get(`25`)} Código do Ticket:`,
                                `\`${codigo}\``,
                                `${dbEmojis.get(`1`)} Motivo do Fechamento:`,
                                `\`${motivof}\``,
                                `${dbEmojis.get(`27`)} Horário de abertura:`,
                                `<t:${tickets.horario1}:f> <t:${tickets.horario2}:R>`,
                                `${dbEmojis.get(`27`)} Horário do fechamento:`,
                                `<t:${Math.floor(new Date() / 1000)}:f> (<t:${~~(new Date() / 1000)}:R>)`
                            ].join('\n'))
                            .addFields(
                                { name: `Baixe as logs para verificar o que foi feito.`, value: `[CLIQUE AQUI](${msg.url}) para ir para o transcript desse ticket.` }
                            )
                    ]
                })
            }

            if (user) {
                const embed = new EmbedBuilder()
                    .setTitle(`${dbEmojis.get(`1`)} | SEU TICKET FOI FECHADO`)
                    .addFields(
                        {
                            name: `${dbEmojis.get(`32`)} | Ticket aberto por:`,
                            value: `> ${user || `<@${usuario}> (saiu do servidor)`}`,
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
                    )
                    .setColor("Random")

                if (tickets.motivo === "Não Escrito") {
                } else {
                    embed.addFields(
                        {
                            name: `${dbEmojis.get(`25`)} | Motivo Ticket`,
                            value: `\`${motivo}\``,
                            inline: false
                        },
                    )
                }

                const buttons = dbTickets.get(`${painelId}.buttons`)
                const id = Number(tickets.idbutton) - 1
                if (dbTickets.get(`${painelId}.tipo`) === "button") {
                    if (buttons[id].finaliza === "ON" || dbTickets.get(`${painelId}.modal.finaliza`) === "ON") {
                        embed.addFields(
                            {
                                name: `${dbEmojis.get(`2`)} | Motivo da Finalização`,
                                value: `\`${motivof}\``,
                                inline: false
                            },
                        )
                    }
                } else {
                    if (dbTickets.get(`${painelId}.modal.finaliza`) === "ON") {
                        embed.addFields(
                            {
                                name: `${dbEmojis.get(`2`)} | Motivo da Finalização`,
                                value: `\`${motivof}\``,
                                inline: false
                            },
                        )
                    }
                }

                embed.addFields(
                    {
                        name: `${dbEmojis.get(`27`)} | Horário do fechamento:`,
                        value: `<t:${Math.floor(new Date() / 1000)}:f> (<t:${~~(new Date() / 1000)}:R>)`,
                        inline: false
                    }
                )
                user.send({
                    embeds: [embed],
                }).catch(error => { })
            } else if (!user) {
                interaction.channel.send({ content: `${dbEmojis.get(`2`) || '❗'} | O autor desse ticket não se encontra mais no servidor.` })
            }

            const embed = new EmbedBuilder()
                .setColor(dbConfigs.get(`ticket.color`) || 'Aqua')
                .setTitle(`🎉 | O Ticket foi finalizado!`)
                .setFields(
                    {
                        name: `${dbEmojis.get(`24`)} Staff que fechou: `,
                        value: `${interaction.user} - ${interaction.user.id}`,
                        inline: false
                    },
                    {
                        name: `${dbEmojis.get(`32`)} Usuário que abriu: `,
                        value: `${user || 'Saiu do servidor'} - ${user?.id || 'ID indisponível'}`,
                        inline: false
                    },
                    {
                        name: `${dbEmojis.get(`1`)} Informações: `,
                        value: `Caso queira ver as logs do ticket clique no botão abaixo para conferir.`,
                        inline: false
                    }
                )
            interaction.channel.send({ embeds: [embed] })

            const rowww = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(1)
                        .setCustomId(`${interaction.channel.id}_avalia_atendimentoo`)
                        .setLabel(`Avaliar Atendimento`)
                        .setEmoji(dbEmojis.get(`28`))
                )
            if (user) {
                user.send({ components: [rowww] }).then(msg => {
                    setTimeout(() => {
                        msg.delete()
                    }, 120000);
                }).catch(error => { })
            }
            interaction.deferUpdate()

            const hasDB = await dbRankingTicket.get(`${interaction.user.id}.finalizados`) || 0
            await dbRankingTicket.set(`${interaction.user.id}.finalizados`, hasDB + 1)

            const channel = await client.channels.fetch(interaction.channel.id);
            let messages;
            let lastMessageId;
            const userMessageCount = {};

            do {
                messages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
                messages.forEach(async message => {
                    if (!message.author.bot && message.author.id != usuario) {
                        const userId = message.author.id;
                        userMessageCount[userId] = (userMessageCount[userId] || 0) + 1;
                    }
                });
                lastMessageId = messages.size > 0 ? messages.last().id : null;
            } while (messages.size > 0);
            for (const [userId, count] of Object.entries(userMessageCount)) {
                const user = await client.users.fetch(userId);
                const hasMessages = await dbRankingTicket.get(`${user.id}.messages`) || 0
                await dbRankingTicket.set(`${user.id}.messages`, hasMessages + count)
            }
        }

        if (interaction.isModalSubmit()) {
            const customId = interaction.customId;
            const tabom = customId.split("_")[0];
            const tabom2 = customId.split("_")[1]

            if (customId.endsWith('_modal_ticket')) {
                const motivo = interaction.fields.getTextInputValue("motivo");
                let desctct = "Não Escrito";
                const textInputComponents = interaction.components.flatMap(row => row.components)
                    .filter(component => component.type === 'TextInput');
                const id = Number(tabom2) - 1
                if (textInputComponents.length === 2) {
                    desctct = interaction.fields.getTextInputValue("desc")
                }
                const permissionOverwrites = [
                    {
                        id: interaction.guild.id,
                        deny: ["ViewChannel"],
                    },
                    {
                        id: interaction.user.id,
                        allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions"],
                    }
                ];

                const msggg = await interaction.reply({
                    content: `Seu Ticket está sendo aberto, aguarde...`,
                    flags: MessageFlags.Ephemeral
                })

                let categoria = "";

                if (dbTickets.get(`${tabom}.tipo`) === "button") {
                    let buttons = []
                    const id = Number(tabom2) - 1
                    buttons = dbTickets.get(`${tabom}.buttons`)[id]

                    if (await buttons.categoria) {
                        categoria = await buttons.categoria
                    } else {
                        categoria = await dbConfigs.get(`ticket.ticket.categoria`)
                    }
                }

                if (dbTickets.get(`${tabom}.tipo`) === "select") {
                    let type = getCache(null, 'type')
                    if (type?.Ticket?.status !== true) {
                        interaction.reply({ content: `❌ | Sistema de ticket desabilitado pois o plano não foi ativo.`, flags: MessageFlags.Ephemeral })
                        return
                    }

                    let selectArray = dbTickets.get(`${tabom}.select`) || []
                    const elementIndex = selectArray.findIndex(element => element.id === Number(tabom2));

                    if (elementIndex !== -1) {
                        if (selectArray[elementIndex].categoria) {
                            categoria = selectArray[elementIndex].categoria
                        } else {
                            categoria = dbConfigs.get(`ticket.ticket.categoria`)
                        }
                    }
                }

                const palmito = await interaction.guild.channels.cache.get(categoria)
                if (!palmito) {
                    msggg.edit({
                        content: ``, embeds: [
                            new EmbedBuilder()
                                .setColor('#ff0000')
                                .setTitle(`${dbEmojis.get(`13`)} | Categoria Inválida`)
                                .setDescription(`Configure o bot direito! Dê o comando \`/botconfig\` e vá em \`Principais\` e selecione a opção \`Categoria Ticket\`, coloque um id de uma categoria válida!`)
                        ], flags: MessageFlags.Ephemeral
                    })
                    return;
                }

                await interaction.guild.channels.create({
                    name: `🎫・${interaction.user.username}`,
                    type: 0,
                    parent: categoria,
                    topic: interaction.user.id,
                    permissionOverwrites: permissionOverwrites,
                }).then(async (channels) => {
                    msggg.edit({
                        content: `${dbEmojis.get(`6`)} | ${interaction.user} Seu Ticket foi aberto no canal: ${channels.url}`,
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(5)
                                        .setURL(channels.url)
                                        .setLabel("Ir para o ticket")
                                )
                        ], flags: MessageFlags.Ephemeral
                    })
                    const user = interaction.user
                    const setChannelID = channels.id

                    dbDataTickets.set(`${channels.id}`, {
                        usuario: user.id,
                        motivo: motivo,
                        codigo: setChannelID,
                        desc: desctct,
                        painel: tabom,
                        idPainel: tabom2,
                        category: categoria,
                        users: [],
                        idbutton: Number(tabom2),
                        horario1: `${Math.floor(new Date() / 1000)}`,
                        horario2: `${~~(new Date() / 1000)}`,
                        staff: "Ninguem Assumiu",
                        canal: channels.id,
                        logsUsers: []
                    })

                    const rolesStaff = dbConfigs.get('ticket.ticket.cargo_staff')
                    if (rolesStaff) {
                        const currentPermissions = channels.permissionOverwrites.cache;

                        for (const rolesID of rolesStaff) {
                            const role = await interaction.guild.roles.fetch(rolesID);
                            let currentRolePermissions = currentPermissions.get(role.id);
                            const newPermissions = {
                                [PermissionFlagsBits.ViewChannel]: true,
                                [PermissionFlagsBits.SendMessages]: true,
                                [PermissionFlagsBits.Connect]: true
                            };

                            if (currentRolePermissions) {
                                await channels.permissionOverwrites.edit(role, newPermissions);
                            } else {
                                await channels.permissionOverwrites.create(role, newPermissions);
                            }
                        }
                    }

                    let desc = `${dbConfigs.get(`ticket.painel.desc`)}`;
                    desc = desc.replace(`{codigo}`, channels.id);
                    desc = desc.replace(`{motivo}`, `${dbDataTickets.get(`${channels.id}.motivo`)}`);
                    desc = desc.replace(`{desc}`, `${dbDataTickets.get(`${channels.id}.desc`)}`);
                    desc = desc.replace(`{assumido}`, `${dbDataTickets.get(`${channels.id}.staff`,)}`);
                    desc = desc.replace(`{user}`, `<@${dbDataTickets.get(`${channels.id}.usuario`)}>`);
                    desc = desc.replace(`{horario2}`, `<t:${dbDataTickets.get(`${channels.id}.horario2`)}:R>`);
                    desc = desc.replace(`{horario1}`, `<t:${dbDataTickets.get(`${channels.id}.horario1`)}:f>`);

                    const embeds = new EmbedBuilder()
                        .setDescription(desc)

                    const messageToFix = await channels.send({
                        content: `# TICKET - ${dbDataTickets.get(`${channels.id}.codigo`)}\n${user}`,
                        embeds: [
                            embeds
                        ],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId("sairdoticket")
                                        .setLabel("Sair do ticket")
                                        .setEmoji(dbConfigs.get(`ticket.painel.button.sair`) || '💨')
                                        .setStyle(ButtonStyle.Danger),
                                    new ButtonBuilder()
                                        .setCustomId("painel_member")
                                        .setLabel("Painel Membro")
                                        .setEmoji(dbConfigs.get(`ticket.painel.button.membro`) || '🧮')
                                        .setStyle(2),
                                    new ButtonBuilder()
                                        .setCustomId("painel_staff")
                                        .setLabel("Painel Staff")
                                        .setEmoji(dbConfigs.get(`ticket.painel.button.staff`) || '📑')
                                        .setStyle(2),
                                    new ButtonBuilder()
                                        .setCustomId("ticket_assumir")
                                        .setLabel("Assumir Ticket")
                                        .setEmoji(dbConfigs.get(`ticket.painel.button.assumir`) || '🔨')
                                        .setStyle(3),
                                    new ButtonBuilder()
                                        .setCustomId("ticket_finalizar")
                                        .setLabel("Finalizar Ticket")
                                        .setEmoji(dbConfigs.get(`ticket.painel.button.finalizar`) || '🧨')
                                        .setStyle(ButtonStyle.Danger),
                                )
                        ]
                    })
                    await messageToFix.pin()
                    const chanal = interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.canal_logs`))
                    if (!chanal) return;
                    chanal.send({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`${dbEmojis.get(`1`)} TICKET **${setChannelID}** aberto por **${user.username}**, para acessar **[CLIQUE AQUI](${channels.url})**`)
                                .setColor(dbConfigs.get(`ticket.color`) || 'Aqua')
                        ]
                    })

                    if (dbTickets.get(`${tabom}.tipo`) === "button") {
                        const id = Number(tabom2) - 1
                        const buttons = dbTickets.get(`${tabom}.buttons`)

                        if (buttons[id].msg.sistema === "ON") {
                            channels.send(`${buttons[id].msg.mensagem || `Olá ${interaction.user} 👋. Por favor, adiante o **ASSUNTO** que você gostaria de discutir no ticket. Caso você não relate o assunto nós **FECHAREMOS O TICKET** depois de algum tempo.`}`)
                        }
                    }

                    if (dbTickets.get(`${tabom}.tipo`) === "select") {
                        const id = Number(tabom2) - 1
                        const selectMenu = dbTickets.get(`${tabom}.select`)

                        if (selectMenu[id].msg.sistema === "ON") {
                            channels.send(`${selectMenu[id].msg.mensagem || `Olá ${interaction.user} 👋. Por favor, adiante o **ASSUNTO** que você gostaria de discutir no ticket. Caso você não relate o assunto nós **FECHAREMOS O TICKET** depois de algum tempo.`}`)
                        }
                    }
                }).catch(error => {
                    try {
                        if (error.message === 'Maximum number of channels in category reached (50)') {
                            msggg.edit({ content: '❗ | O limite de tickets foi atingido, por favor avise a staff!', flags: MessageFlags.Ephemeral })
                        } else {
                            console.error(error.message)
                        }
                    } catch (err) {
                        console.log(err.message)
                    }
                })
            }
        }
    }
}