const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, PermissionsBitField, UserSelectMenuBuilder, PermissionFlagsBits } = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })
const dbTickets = new JsonDatabase({ databasePath: "./databases/tickets.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const dbDataTicket = new JsonDatabase({ databasePath: "./databases/data_ticket.json" })
module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        //Ticket Set-Panel
        if (interaction.isStringSelectMenu() && interaction.customId === "select-set-painel") {
            const option = interaction.values[0]

            if (option === dbTickets.get(`${option}.idpainel`)) {
                if (dbTickets.get(`${option}.tipo`) === "button") {
                    const embed = new EmbedBuilder()
                        .setTitle(`${dbTickets.get(`${option}.title`)}`)
                        .setDescription(`${dbTickets.get(`${option}.desc`)}`)
                        .setColor(dbConfigs.get(`ticket.color`) || "Default")

                    if (dbTickets.get(`${option}.banner`)) {
                        embed.setImage(dbTickets.get(`${option}.banner`))
                    }
                    if (dbTickets.get(`${option}.thumb`)) {
                        embed.setThumbnail(dbTickets.get(`${option}.thumb`))
                    }

                    const row = new ActionRowBuilder()
                    dbTickets.get(`${option}.buttons`).map(entry => {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`${entry.id}_${option}`)
                                .setEmoji(entry.emoji)
                                .setLabel(entry.text)
                                .setStyle(entry.style)
                        )
                    })


                    if (dbTickets.get(`${option}.modomsg`) === "ON") {
                        let options = {
                            content: dbTickets.get(`${option}.desc`),
                            components: [row]
                        }
                        if (dbTickets.get(`${option}.banner`)) {
                            options.files = [dbTickets.get(`${option}.banner`)]
                        }
                        interaction.channel.send(options).then(msg => {
                            dbTickets.set(`${option}.idmsg`, msg.id)
                            dbTickets.set(`${option}.idcanal`, interaction.channel.id)
                            interaction.reply({ content: `${dbEmojis.get(`6`)} | Mensagem enviada com sucesso!`, flags: MessageFlags.Ephemeral })
                        }).catch(() => {
                            interaction.reply({ content: `${dbEmojis.get(`13`)} | Ocorreu um erro ao enviar a mensagem!`, flags: MessageFlags.Ephemeral })
                        })
                    } else {
                        interaction.channel.send({ embeds: [embed], components: [row] }).then(msg => {
                            dbTickets.set(`${option}.idmsg`, msg.id)
                            dbTickets.set(`${option}.idcanal`, interaction.channel.id)
                            interaction.reply({ content: `${dbEmojis.get(`6`)} | Mensagem enviada com sucesso!`, flags: MessageFlags.Ephemeral })
                        }).catch(() => {
                            interaction.reply({ content: `${dbEmojis.get(`13`)} | Ocorreu um erro ao enviar a mensagem!`, flags: MessageFlags.Ephemeral })
                        })
                    }
                }
                if (dbTickets.get(`${option}.tipo`) === "select") {
                    const embed = new EmbedBuilder()
                        .setTitle(`${dbTickets.get(`${option}.title`)}`)
                        .setDescription(`${dbTickets.get(`${option}.desc`)}`)
                        .setColor(dbConfigs.get(`ticket.color`) || "Default")

                    if (dbTickets.get(`${option}.banner`)) {
                        embed.setImage(dbTickets.get(`${option}.banner`))
                    }
                    if (dbTickets.get(`${option}.thumb`)) {
                        embed.setThumbnail(dbTickets.get(`${option}.thumb`))
                    }

                    const actionrowselect = new StringSelectMenuBuilder()
                        .setCustomId('select_ticket')
                        .setPlaceholder(dbTickets.get(`${option}.placeholder`) || "")

                    const paineis = dbTickets.get(`${option}.select`);

                    const selectOptions = paineis.map(painel => ({
                        label: painel.text,
                        description: painel.desc,
                        value: `${option}_${painel.id}`,
                        emoji: painel.emoji
                    }));
                    actionrowselect.addOptions(selectOptions);

                    const row = new ActionRowBuilder()
                        .addComponents(actionrowselect)

                    if (dbTickets.get(`${option}.modomsg`) === "ON") {
                        let options = {
                            content: dbTickets.get(`${option}.desc`),
                            components: [row]
                        }
                        if (dbTickets.get(`${option}.banner`)) {
                            options.files = [dbTickets.get(`${option}.banner`)]
                        }
                        interaction.channel.send(options).then(msg => {
                            dbTickets.set(`${option}.idmsg`, msg.id)
                            dbTickets.set(`${option}.idcanal`, interaction.channel.id)
                            interaction.reply({ content: `${dbEmojis.get(`6`)} | Mensagem enviada com sucesso!`, flags: MessageFlags.Ephemeral })
                        }).catch(() => {
                            interaction.reply({ content: `${dbEmojis.get(`13`)} | Ocorreu um erro ao enviar a mensagem!`, flags: MessageFlags.Ephemeral })
                        })
                    } else {
                        interaction.channel.send({ embeds: [embed], components: [row] }).then(msg => {
                            dbTickets.set(`${option}.idmsg`, msg.id)
                            dbTickets.set(`${option}.idcanal`, interaction.channel.id)
                            interaction.reply({ content: `${dbEmojis.get(`6`)} | Mensagem enviada com sucesso!`, flags: MessageFlags.Ephemeral })
                        }).catch(() => {
                            interaction.reply({ content: `${dbEmojis.get(`13`)} | Ocorreu um erro ao enviar a mensagem!`, flags: MessageFlags.Ephemeral })
                        })
                    }
                }
            }
        }

        //Ticket Config Panels
        if (interaction.customId === "painel_staff") {
            const user1 = await interaction.guild.members.fetch(interaction.user.id);
            const rolesArrayFind = await dbConfigs.get(`ticket.ticket.cargo_staff`);
            const roleIdToCheck = await user1.roles.cache.some(role => rolesArrayFind.includes(role.id))
            const hasRequiredRole = roleIdToCheck || user1.permissions.has(PermissionsBitField.Flags.Administrator)

            if (!hasRequiredRole) {
                await interaction.reply({ content: 'Você não tem permissão para usar este botão.', flags: MessageFlags.Ephemeral });
                return;
            }

            interaction.reply({
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`painel_stafff`)
                                .setPlaceholder(`Selecione uma opção...`)
                                .addOptions(
                                    {
                                        label: `Chamar Usuário`,
                                        description: `O BOT envia uma notificação para o usuário que abriu o ticket.`,
                                        value: `chamar_userrr`,
                                        emoji: "<a:white_sino_rtx:1241739225326555216>"
                                    },
                                    {
                                        label: `Adicionar um usuario`,
                                        description: `O BOT adiciona um usuário de sua escolha no ticket.`,
                                        value: `add_userrr`,
                                        emoji: "<:mais:1225477811741921393>"
                                    },
                                    {
                                        label: `Remover um usuario`,
                                        description: `O BOT remove um usuário de sua escolha do ticket.`,
                                        value: `remove_userrr`,
                                        emoji: "<:menos2:1225477800425689210>"
                                    },
                                    {
                                        label: `Mudar nome do Canal`,
                                        description: `Mude o nome do canal do ticket.`,
                                        value: `mudar_name_channel`,
                                        emoji: "<:Cupom:1225477547630788648>"
                                    },
                                    {
                                        label: `Criar canal de voz`,
                                        description: `Crie um canal de voz para conversar com o usuário do ticket.`,
                                        value: `create_call`,
                                        emoji: "<:lupa:1225477825285328979>"
                                    },
                                )
                        )
                ], flags: MessageFlags.Ephemeral
            })
        }

        if (interaction.isStringSelectMenu() && interaction.customId === "painel_stafff") {
            const option = interaction.values[0];

            if (option === "create_call") {
                const tickets = await dbDataTicket.get(`${interaction.channel.id}`)
                const usuario = tickets.usuario
                const user = interaction.guild.members.cache.get(usuario)
                const motivo = tickets.motivo
                const codigo = tickets.codigo
                const staff = interaction.guild.members.cache.get(tickets.staff)
                const options = [
                    {
                        id: interaction.guild.id,
                        deny: [
                            PermissionsBitField.Flags.ViewChannel,
                        ],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect
                        ],
                    },
                    {
                        id: user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect
                        ],
                    }
                ]
                let users = dbDataTicket.get(`${interaction.channel.id}.users`)
                if (users.length >= 1) {
                    users.map(users => {
                        options.push(
                            {
                                id: users,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.Connect
                                ],
                            }
                        )
                    })
                }
                await interaction.guild.channels.create({
                    name: `📞・${user.user.username}`,
                    type: 2,
                    parent: dbDataTicket.get(`${interaction.channel.id}.category`),
                    permissionOverwrites: options
                }).then(async (channel) => {
                    const embed = new EmbedBuilder()
                        .setTitle(`📞 Canal de Voz Criado!`)
                        .setDescription(`- Acesse o canal de voz em ${channel.url}! Converse e resolva os seus problemas.`)
                        .setColor(dbConfigs.get(`ticket.color`))
                        .setTimestamp()

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(5)
                                .setLabel(`Acessar Canal de Voz`)
                                .setEmoji("<:lupa:1225477825285328979>")
                                .setURL(channel.url),
                            new ButtonBuilder()
                                .setStyle(4)
                                .setCustomId("delete_call")
                                .setLabel(`Deletar Canal de Voz`)
                        )

                    const rolesStaff = dbConfigs.get('ticket.ticket.cargo_staff')
                    if (rolesStaff) {
                        const currentPermissions = interaction.channel.permissionOverwrites.cache;

                        for (const rolesID of rolesStaff) {
                            const role = await interaction.guild.roles.fetch(rolesID);
                            let currentRolePermissions = currentPermissions.get(role.id);
                            const newPermissions = {
                                [PermissionFlagsBits.ViewChannel]: true,
                                [PermissionFlagsBits.SendMessages]: true,
                                [PermissionFlagsBits.Connect]: true
                            };

                            if (currentRolePermissions) {
                                await interaction.channel.permissionOverwrites.edit(role, newPermissions);
                            } else {
                                await interaction.channel.permissionOverwrites.create(role, newPermissions);
                            }
                        }
                    }

                    interaction.channel.send({ embeds: [embed], components: [row] }).then(async () => {
                        interaction.reply({ content: `${dbEmojis.get(`6`)} | Canal de voz criado com sucesso!`, flags: MessageFlags.Ephemeral })
                        dbDataTicket.set(`${interaction.channel.id}.call`, channel.id)
                    }).catch(async (err) => {
                        console.log(err)
                        interaction.reply({ content: `${dbEmojis.get(`13`)} | Canal de voz não foi criado! Peça suporte para a **ZEND APPLICATIONS** para saber o motivo.`, flags: MessageFlags.Ephemeral })
                    })

                }).catch(async (err) => {
                    console.log(err)
                    interaction.reply({ content: `${dbEmojis.get(`13`)} | Canal de voz não foi criado! Peça suporte para a **ZEND APPLICATIONS** para saber o motivo.`, flags: MessageFlags.Ephemeral })
                })
            }
            if (option === "mudar_name_channel") {
                const modal = new ModalBuilder()
                    .setCustomId(`modal_mudarnamechannel`)
                    .setTitle("novo nome ticket")

                const text = new TextInputBuilder()
                    .setCustomId("p1")
                    .setLabel("Coloque o novo nome")
                    .setValue(`🎫・`)
                    .setPlaceholder("Digite aqui")
                    .setStyle(1)

                modal.addComponents(new ActionRowBuilder().addComponents(text))

                return interaction.showModal(modal)
            }

            if (option === "chamar_userrr") {
                const tickets = await dbDataTicket.get(`${interaction.channel.id}`)
                const usuario = tickets.usuario
                const user = interaction.guild.members.cache.get(usuario)
                const motivo = tickets.motivo
                const codigo = tickets.codigo
                const staff = interaction.guild.members.cache.get(tickets.staff)
                if (user) {
                    user.send({
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setTitle(`Ticket | Notificação`)
                                .setDescription(`${dbEmojis.get("31")} | Olá ${user}, Seu ticket foi respondido por ${interaction.user}, para ir até ele, clique no botão abaixo!`)
                                .setColor(dbConfigs.get(`ticket.color`))
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

                    }).then(async () => {
                        await interaction.channel.send({
                            content: `${user}`,
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`${dbEmojis.get("32")} | ${user}, o staff ${interaction.user} quer uma resposta de você!`)
                                    .setColor(dbConfigs.get(`ticket.color`))
                            ],
                        })
                        await interaction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`${dbEmojis.get("6")} | ${interaction.user}, menssagem enviada com sucesso!`)
                                    .setColor("Green")
                            ],
                            components: [],
                            flags: MessageFlags.Ephemeral
                        })
                        return;
                    }).catch(async (error) => {
                        console.error(error)
                        await interaction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`${dbEmojis.get("13")} | ${interaction.user}, Ocorreu um erro ao notificar o usuário na DM!`)
                                    .setColor("Red")
                            ],
                            components: [],
                            flags: MessageFlags.Ephemeral
                        })
                        return;
                    })
                } else {
                    interaction.reply({
                        content: `${dbEmojis.get(`13`)} | Ocorreu um erro ao utilizar essa função!`,
                        flags: MessageFlags.Ephemeral
                    })
                }
            }
            if (option === "add_userrr") {
                const select = new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                            .setCustomId(`add_user__`)
                            .setMaxValues(1)
                            .setPlaceholder(`Selecione um usuário...`),
                    )
                interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${dbEmojis.get(`34`)}  Gerenciando Usuários no Ticket`)
                            .setDescription(`${dbEmojis.get(`29`)} Selecione abaixo no SELECT MENU quem você deseja adicionar ao ticket\n\n${dbEmojis.get(`2`)} Lembre-se, ao adicionar o membro, ele terá permissão de visualizar o ticket e será avisado no privado\n\n${dbEmojis.get(`1`)} Caso queira REMOVER do canal, use a opção REMOVER USUÁRIO`)
                            .setColor(dbConfigs.get(`ticket.color`))
                    ],
                    components: [select],
                    flags: MessageFlags.Ephemeral
                })
            }

            if (option === "remove_userrr") {
                const select = new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                            .setCustomId(`remove_user__`)
                            .setMaxValues(1)
                            .setPlaceholder(`Selecione um usuário...`),
                    )
                interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${dbEmojis.get(`34`)}  Gerenciando Usuários no Ticket`)
                            .setDescription(`${dbEmojis.get(`29`)} Selecione abaixo no SELECT MENU quem você deseja remover ao ticket\n\n${dbEmojis.get(`2`)} Lembre-se, ao remover o membro, ele perderá permissão de visualizar o ticket e será avisado no privado\n\n${dbEmojis.get(`1`)} Caso queira ADICIONAR novamente ao canal, use a opção ADICIONAR USUÁRIO`)
                            .setColor(dbConfigs.get(`ticket.color`))
                    ],
                    components: [select],
                    flags: MessageFlags.Ephemeral
                })
            }
        }

        if (interaction.customId === "delete_call") {
            const user1 = interaction.guild.members.cache.get(interaction.user.id);
            const rolesArrayFind = dbConfigs.get(`ticket.ticket.cargo_staff`);
            const roleIdToCheck = user1.roles.cache.some(role => rolesArrayFind.includes(role.id))
            const hasRequiredRole = user1.roles.cache.has(roleIdToCheck) || user1.permissions.has(PermissionsBitField.Flags.Administrator)

            if (!hasRequiredRole) {
                await interaction.reply({ content: 'Você não tem permissão para usar este botão.', flags: MessageFlags.Ephemeral });
                return;
            }

            const canal = interaction.guild.channels.cache.get(dbDataTicket.get(`${interaction.channel.id}.call`))
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setStyle(4)
                        .setCustomId(`${interaction.message.id}_delete_call2`)
                        .setLabel(`Deletar Canal de Voz`)
                )
            interaction.reply({ content: `${dbEmojis.get(`1`)} Tem certeza em apagar o canal de voz ${canal.url}?`, components: [row], flags: MessageFlags.Ephemeral })
        }

        if (interaction.isButton()) {
            const customId = interaction.customId;
            const msgId = customId.split("_")[0]
            if (customId.endsWith("_delete_call2")) {
                const canal = interaction.guild.channels.cache.get(dbDataTicket.get(`${interaction.channel.id}.call`))
                canal.delete().then(async () => {
                    const embed = new EmbedBuilder()
                        .setTitle(`📞 Canal de Voz Apagado!`)
                        .setDescription(`- Canal de voz **${canal.name}** apagado com sucesso!`)
                        .setColor(dbConfigs.get(`ticket.color`))
                        .setTimestamp()

                    interaction.channel.send({ embeds: [embed] }).then(async () => {
                        interaction.update({ content: `${dbEmojis.get(`6`)} | Canal de voz apagado com sucesso!`, components: [], flags: MessageFlags.Ephemeral })
                        interaction.channel.messages.fetch(msgId).then(msg => {
                            msg.delete()
                        })
                        dbDataTicket.delete(`${interaction.channel.id}.call`)
                    }).catch(async () => {
                        console.error()
                        interaction.reply({ content: `${dbEmojis.get(`6`)} | Canal de voz não foi apagado! Peça suporte para a **ZEND APPLICATIONS** para saber o motivo.`, flags: MessageFlags.Ephemeral })
                    })
                }).catch(async () => {
                    console.error()
                    interaction.reply({ content: `${dbEmojis.get(`6`)} | Canal de voz não foi apagado! Peça suporte para a **ZEND APPLICATIONS** para saber o motivo.`, flags: MessageFlags.Ephemeral })
                })
            }
        }

        if (interaction.isModalSubmit() && interaction.customId === "modal_mudarnamechannel") {
            const nome = interaction.fields.getTextInputValue("p1");

            interaction.channel.edit({ name: nome }).then(async () => {
                interaction.reply({ content: `${dbEmojis.get(`6`)} | Nome do canal alterado!`, embeds: [], flags: MessageFlags.Ephemeral, components: [] })
                interaction.channel.send({
                    embeds: [
                        new EmbedBuilder().setDescription(`${dbEmojis.get(`2`)} | Nome do canal alterado para \`${nome}\`!`),
                    ],
                    components: [],
                    flags: MessageFlags.Ephemeral,
                });
            }).catch(async () => {
                interaction.update({ content: `${dbEmojis.get(`13`)} | Não foi possível alterar o nome do canal. Tente novamente mais tarde.`, flags: MessageFlags.Ephemeral, components: [], embeds: [] })
            })
        }

        if (interaction.isUserSelectMenu() && interaction.customId === "add_user__") {
            const tickets = await dbDataTicket.get(`${interaction.channel.id}`)
            const usuario = tickets.usuario
            const user = interaction.guild.members.cache.get(usuario)
            const motivo = tickets.motivo
            const codigo = tickets.codigo
            const staff = interaction.guild.members.cache.get(tickets.staff)
            const cargos = interaction.values
            cargos.map(async (cargos) => {
                const user_content = cargos
                const user_collected = interaction.guild.members.cache.get(user_content);
                if (user_collected.id === usuario) return interaction.update({
                    content: `${dbEmojis.get(`13`)} | Não é possível remover o dono do ticket!`,
                    components: [],
                    embeds: [],
                    flags: MessageFlags.Ephemeral,
                });
                if (!user_collected)
                    return interaction.update({
                        embeds: [
                            new EmbedBuilder().setDescription(
                                `${dbEmojis.get(`13`)} | Não foi possível encontrar o usuário \`${user_content}\`, tente novamente!`
                            ),
                        ],
                        components: [],
                        embeds: [],
                        flags: MessageFlags.Ephemeral,
                    });

                if (interaction.channel.permissionsFor(user_collected.id).has("ViewChannel")) return interaction.update({ content: `${dbEmojis.get(`2`)} | O usuário ${user_collected}(\`${user_collected.id}\`) já possui acesso ao ticket!`, components: [], flags: MessageFlags.Ephemeral, embeds: [] });
                dbDataTicket.push(`${interaction.channel.id}.users`, user_collected.id)
                const permissionOverwrites = [
                    {
                        id: interaction.guild.id,
                        deny: ["ViewChannel"],
                    },
                    {
                        id: user_collected.id,
                        allow: ["ViewChannel"],
                    },
                ];
                const users = dbDataTicket.get(`${interaction.channel.id}.users`)
                if (users.length >= 1) {
                    users.map(users => {
                        permissionOverwrites.push(
                            {
                                id: users,
                                allow: [
                                    "ViewChannel",
                                    "SendMessages",
                                    "AttachFiles",
                                    "AddReactions",
                                    "ReadMessageHistory",
                                ],
                            }
                        )
                    })
                }

                interaction.channel.edit({ permissionOverwrites: permissionOverwrites, });

                interaction.update({
                    embeds: [
                        new EmbedBuilder().setDescription(`${dbEmojis.get(`6`)} | O usuário ${user_collected}(\`${user_collected.id}\`) foi adicionado com sucesso!`),
                    ],
                    components: [],
                    flags: MessageFlags.Ephemeral,
                });
                interaction.channel.send({
                    embeds: [
                        new EmbedBuilder().setDescription(`${dbEmojis.get(`2`)} | O usuário ${user_collected}(\`${user_collected.id}\`) foi adicionado ao ticket!`),
                    ],
                    components: [],
                });
            })
        }

        if (interaction.isUserSelectMenu() && interaction.customId === "remove_user__") {
            const tickets = await dbDataTicket.get(`${interaction.channel.id}`)
            const usuario = tickets.usuario
            const user = interaction.guild.members.cache.get(usuario)
            const motivo = tickets.motivo
            const codigo = tickets.codigo
            const staff = interaction.guild.members.cache.get(tickets.staff)
            const cargos = interaction.values
            cargos.map(async (cargos) => {
                const user_content = cargos
                const user_collected = interaction.guild.members.cache.get(user_content);
                if (user_collected.id === usuario) return interaction.update({
                    content: `${dbEmojis.get(`13`)} | Não é possível remover o dono do ticket!`,
                    components: [],
                    embeds: [],
                    flags: MessageFlags.Ephemeral,
                });
                if (!user_collected) return interaction.update({
                    content: `${dbEmojis.get(`13`)} | Não foi possível encontrar o usuário \`${user_content}\`, tente novamente!`,
                    components: [],
                    flags: MessageFlags.Ephemeral,
                });

                if (!interaction.channel.permissionsFor(user_collected.id).has("ViewChannel")) return interaction.update({
                    embeds: [
                        new EmbedBuilder().setDescription(
                            `${dbEmojis.get(`13`)} | O usuário ${user_collected} (\`${user_collected.id}\`) não possui acesso ao ticket!`
                        ),
                    ],
                    components: [],
                    embeds: [],
                    flags: MessageFlags.Ephemeral,
                });

                const users = dbDataTicket.get(`${interaction.channel.id}.users`)

                const usersId = users.findIndex(user => user === user_collected.id);

                users.splice(usersId, 1);
                dbDataTicket.set(`${interaction.channel.id}.users`, users)

                const permissionOverwrites = [
                    {
                        id: interaction.guild.id,
                        deny: ["ViewChannel"],
                    },
                    {
                        id: user_collected.id,
                        deny: ["ViewChannel"],
                    },
                    {
                        id: user.id,
                        allow: [
                            "ViewChannel",
                            "SendMessages",
                            "AttachFiles",
                            "AddReactions",
                            "ReadMessageHistory",
                        ],
                    }
                ];
                if (users.length >= 1) {
                    users.map(users => {
                        permissionOverwrites.push(
                            {
                                id: users,
                                allow: [
                                    "ViewChannel",
                                    "SendMessages",
                                    "AttachFiles",
                                    "AddReactions",
                                    "ReadMessageHistory",
                                ],
                            }
                        )
                    })
                }

                const rolesStaff = dbConfigs.get('ticket.ticket.cargo_staff')
                if (rolesStaff) {
                    const currentPermissions = interaction.channel.permissionOverwrites.cache;

                    for (const rolesID of rolesStaff) {
                        const role = await interaction.guild.roles.fetch(rolesID);
                        let currentRolePermissions = currentPermissions.get(role.id);
                        const newPermissions = {
                            [PermissionFlagsBits.ViewChannel]: true,
                            [PermissionFlagsBits.SendMessages]: true,
                            [PermissionFlagsBits.Connect]: true
                        };

                        if (currentRolePermissions) {
                            await interaction.channel.permissionOverwrites.edit(role, newPermissions);
                        } else {
                            await interaction.channel.permissionOverwrites.create(role, newPermissions);
                        }
                    }
                }

                interaction.update({
                    embeds: [
                        new EmbedBuilder().setDescription(`${dbEmojis.get(`6`)} | O usuário ${user_collected} (\`${user_collected.id}\`) foi removido com sucesso!`),
                    ],
                    components: [],
                    flags: MessageFlags.Ephemeral,
                });
                interaction.channel.send({
                    embeds: [
                        new EmbedBuilder().setDescription(`${dbEmojis.get(`2`)} | O usuário ${user_collected}(\`${user_collected.id}\`) foi removido do ticket!`),
                    ],
                    components: [],
                });
            })
        }

        if (interaction.customId === "painel_member") {
            interaction.reply({
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`painel_usuario`)
                                .setPlaceholder(`Selecione uma opção...`)
                                .addOptions(
                                    {
                                        label: `Chamar Staff`,
                                        description: `É enviada uma notificação para o staff que ASSUMIU o ticket.`,
                                        value: `chamar_staff`,
                                        emoji: "<a:white_sino_rtx:1241739225326555216>"
                                    },
                                    {
                                        label: `Adicionar um usuario`,
                                        description: `O BOT adiciona um usuário de sua escolha no ticket.`,
                                        value: `add_user_usuario`,
                                        emoji: "<:mais:1225477811741921393>"
                                    },
                                    {
                                        label: `Remover um usuario`,
                                        description: `O BOT remove um usuário de sua escolha do ticket.`,
                                        value: `remove_user_usuario`,
                                        emoji: "<:menos2:1225477800425689210>"
                                    },
                                ),
                        )
                ], flags: MessageFlags.Ephemeral
            })
        }

        if (interaction.isUserSelectMenu() && interaction.customId === "add_user_usuariok") {
            const cargos = interaction.values
            cargos.map((cargos) => {
                const embed = new EmbedBuilder()
                    .setTitle(`${dbEmojis.get(`1`)} Requisição Adicionar Membro`)
                    .setDescription(`${dbEmojis.get(`34`)} O Usuário ${interaction.user} está querendo adicionar o MEMBRO <@${cargos}> ao TICKET`)
                    .setColor(dbConfigs.get(`ticket.color`) || `Default`)

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${cargos}_add_user_aceitar`)
                            .setLabel(`Aceitar Adição`)
                            .setEmoji(dbEmojis.get(`6`)),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`_user_negar`)
                            .setLabel(`Negar`)
                            .setEmoji(dbEmojis.get(`13`))
                    )

                interaction.update({ content: `${dbEmojis.get(`6`)} | Requisição enviada com sucesso!`, embeds: [], components: [], flags: MessageFlags.Ephemeral })

                interaction.channel.send({ embeds: [embed], components: [row] })
            })
        }

        if (interaction.isUserSelectMenu() && interaction.customId === "remove_user_usuariok") {
            const cargos = interaction.values
            cargos.map((cargos) => {
                const embed = new EmbedBuilder()
                    .setTitle(`${dbEmojis.get(`1`)} Requisição Adicionar Membro`)
                    .setDescription(`${dbEmojis.get(`34`)} O Usuário ${interaction.user} está querendo remover o MEMBRO <@${cargos}> do TICKET`)
                    .setColor(dbConfigs.get(`ticket.color`) || `Default`)

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${cargos}_sub_user_aceitar`)
                            .setLabel(`Aceitar Remoção`)
                            .setEmoji(dbEmojis.get(`6`)),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`_user_negar`)
                            .setLabel(`Negar`)
                            .setEmoji(dbEmojis.get(`13`))
                    )

                interaction.update({ content: `${dbEmojis.get(`6`)} | Requisição enviada com sucesso!`, embeds: [], components: [], flags: MessageFlags.Ephemeral })

                interaction.channel.send({ embeds: [embed], components: [row] })
            })
        }

        if (interaction.isButton()) {
            const customId = interaction.customId;
            const tabom = customId.split("_")[0];

            if (customId === "_user_negar") {
                const user1 = interaction.guild.members.cache.get(interaction.user.id);
                const rolesArrayFind = dbConfigs.get(`ticket.ticket.cargo_staff`);
                const roleIdToCheck = user1.roles.cache.some(role => rolesArrayFind.includes(role.id))
                const hasRequiredRole = user1.roles.cache.has(roleIdToCheck) || user1.permissions.has(PermissionsBitField.Flags.Administrator)

                if (!hasRequiredRole) {
                    await interaction.reply({ content: 'Você não tem permissão para usar este botão.', flags: MessageFlags.Ephemeral });
                    return;
                }

                interaction.update({ content: `${dbEmojis.get(`6`)} | A requisição foi negada!` })
            }

            if (customId.endsWith('_sub_user_aceitar')) {
                const tickets = await dbDataTicket.get(`${interaction.channel.id}`)
                const usuario = tickets.usuario
                const user = interaction.guild.members.cache.get(usuario)
                const user1 = interaction.guild.members.cache.get(interaction.user.id);
                const rolesArrayFind = dbConfigs.get(`ticket.ticket.cargo_staff`);
                const roleIdToCheck = user1.roles.cache.some(role => rolesArrayFind.includes(role.id))
                const hasRequiredRole = user1.roles.cache.has(roleIdToCheck) || user1.permissions.has(PermissionsBitField.Flags.Administrator)

                if (!hasRequiredRole) {
                    await interaction.reply({ content: 'Você não tem permissão para usar este botão.', flags: MessageFlags.Ephemeral });
                    return;
                }

                const user_content = tabom
                const user_collected = interaction.guild.members.cache.get(user_content);

                if (user_collected?.id === usuario) return interaction.update({
                    content: `${dbEmojis.get(`13`)} | Não é possível remover o dono do ticket!`,
                    components: [],
                    embeds: [],
                    flags: MessageFlags.Ephemeral,
                });

                if (!user_collected) return interaction.update({
                    content: `${dbEmojis.get(`13`)} | Não foi possível encontrar o usuário <@${user_collected}> \`(${user_content})\`, tente novamente!`,
                    components: [],
                    embeds: [],
                    flags: MessageFlags.Ephemeral,
                });

                if (!interaction.channel.permissionsFor(user_collected.id).has("ViewChannel")) return interaction.update({
                    content: `${dbEmojis.get(`13`)} | O usuário ${user_collected} (\`${user_collected.id}\`) não possui acesso ao ticket!`,
                    components: [],
                    embeds: [],
                    flags: MessageFlags.Ephemeral,
                });
                const users = dbDataTicket.get(`${interaction.channel.id}.users`)

                const usersId = users.findIndex(user => user === user_collected.id);

                users.splice(usersId, 1);
                dbDataTicket.set(`${interaction.channel.id}.users`, users)
                const permissionOverwrites = [
                    {
                        id: interaction.guild.id,
                        deny: ["ViewChannel"],
                    },
                    {
                        id: user_collected.id,
                        deny: ["ViewChannel"],
                    }
                ];
                if (users.length >= 1) {
                    users.map(users => {
                        permissionOverwrites.push(
                            {
                                id: interaction.guild.id,
                                deny: ["ViewChannel"],
                            },
                            {
                                id: users,
                                allow: [
                                    "ViewChannel",
                                    "SendMessages",
                                    "AttachFiles",
                                    "AddReactions",
                                    "ReadMessageHistory",
                                ],
                            }
                        )
                    })
                }

                interaction.channel.edit({ permissionOverwrites: permissionOverwrites, });

                const rolesStaff = dbConfigs.get('ticket.ticket.cargo_staff')
                if (rolesStaff) {
                    const currentPermissions = interaction.channel.permissionOverwrites.cache;

                    for (const rolesID of rolesStaff) {
                        const role = await interaction.guild.roles.fetch(rolesID);
                        let currentRolePermissions = currentPermissions.get(role.id);
                        const newPermissions = {
                            [PermissionFlagsBits.ViewChannel]: true,
                            [PermissionFlagsBits.SendMessages]: true,
                            [PermissionFlagsBits.Connect]: true
                        };

                        if (currentRolePermissions) {
                            await interaction.channel.permissionOverwrites.edit(role, newPermissions);
                        } else {
                            await interaction.channel.permissionOverwrites.create(role, newPermissions);
                        }
                    }
                }

                interaction.update({
                    content: `${dbEmojis.get(`6`)} | O usuário ${user_collected} (\`${user_collected.id}\`) foi removido com sucesso!`,
                    components: [],
                    embeds: [],
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (customId.endsWith('_add_user_aceitar')) {
                const tickets = await dbDataTicket.get(`${interaction.channel.id}`)
                const usuario = tickets.usuario
                const user = interaction.guild.members.cache.get(usuario)
                const motivo = tickets.motivo
                const codigo = tickets.codigo
                const staff = interaction.guild.members.cache.get(tickets.staff)
                const user1 = interaction.guild.members.cache.get(interaction.user.id);
                const rolesArrayFind = dbConfigs.get(`ticket.ticket.cargo_staff`);
                const roleIdToCheck = user1.roles.cache.some(role => rolesArrayFind.includes(role.id))
                const hasRequiredRole = user1.roles.cache.has(roleIdToCheck) || user1.permissions.has(PermissionsBitField.Flags.Administrator)

                if (!hasRequiredRole) {
                    await interaction.reply({ content: 'Você não tem permissão para usar este botão.', flags: MessageFlags.Ephemeral });
                    return;
                }

                const user_collected = interaction.guild.members.cache.get(tabom);
                if (!user_collected)
                    return interaction.update({
                        content: `${dbEmojis.get(`13`)} | Não foi possível encontrar o usuário ${tabom}, tente novamente!`,
                        components: [],
                        embeds: [],
                        flags: MessageFlags.Ephemeral,
                    });

                if (user_collected.id === usuario)
                    return interaction.update({
                        content: `${dbEmojis.get(`13`)} | Não é possível adicionar o dono do ticket, ele já tem acesso!`,
                        components: [],
                        embeds: [],
                        flags: MessageFlags.Ephemeral,
                    });

                if (interaction.channel.permissionsFor(user_collected.id).has("ViewChannel"))
                    return interaction.update({
                        content: `${dbEmojis.get(`2`)} | O usuário ${user_collected}(\`${user_collected.id}\`) já possui acesso ao ticket!`,
                        components: [],
                        flags: MessageFlags.Ephemeral,
                    });

                // Adicionar o novo usuário à lista de usuários do ticket
                dbDataTicket.push(`${interaction.channel.id}.users`, user_collected.id)

                // Em vez de substituir todas as permissões, apenas adicione a permissão para o novo usuário
                await interaction.channel.permissionOverwrites.edit(user_collected.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    AttachFiles: true,
                    AddReactions: true,
                    ReadMessageHistory: true
                });

                interaction.update({
                    content: `${dbEmojis.get(`6`)} | O usuário ${user_collected} (\`${user_collected.id}\`) foi adicionado com sucesso!`,
                    embeds: [],
                    components: [],
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        if (interaction.isStringSelectMenu() && interaction.customId === "painel_usuario") {
            const option = interaction.values[0];

            if (option === "chamar_staff") {
                const tickets = await dbDataTicket.get(`${interaction.channel.id}`)
                const usuario = tickets.usuario
                const user = interaction.guild.members.cache.get(usuario)
                const motivo = tickets.motivo
                const codigo = tickets.codigo
                const staff = interaction.guild.members.cache.get(tickets.staff)

                if (interaction.user.id !== user.id) {
                    interaction.reply({
                        content: `Só o usuario: ${user}, pode usar esta função`
                    })
                }
                if (staff) {
                    staff.send({
                        embeds: [
                            new EmbedBuilder()
                                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setTitle(`Ticket | Notificação`)
                                .setDescription(`${dbEmojis.get("31")} | Olá ${staff}. O usuário ${interaction.user} quer uma resposta sua! para ir até ele, clique no botão abaixo!`)
                                .setColor(dbConfigs.get(`ticket.color`))
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
                    }).then(async () => {
                        await interaction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`${dbEmojis.get("6")} | ${interaction.user}. Menssagem enviada com sucesso!`)
                                    .setColor("Green")
                            ],
                            components: [],
                            flags: MessageFlags.Ephemeral
                        })
                        return;
                    }).catch(async () => {
                        await interaction.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(`${dbEmojis.get("13")} | ${interaction.user}. Ocorreu um erro ao notificar o staff na DM!`)
                                    .setColor("Red")
                            ],
                            components: [],
                            flags: MessageFlags.Ephemeral
                        })
                        return;
                    })
                } else {
                    interaction.reply({
                        content: `${dbEmojis.get(`13`)} | Ninguem assumiu seu ticket ainda!`,
                        flags: MessageFlags.Ephemeral
                    })
                }
            }

            if (option === "add_user_usuario") {
                const select = new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                            .setCustomId(`add_user_usuariok`)
                            .setMaxValues(1)
                            .setPlaceholder(`Selecione um usuário...`),
                    )
                interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${dbEmojis.get(`34`)}  Gerenciando Usuários no Ticket`)
                            .setDescription(`${dbEmojis.get(`29`)} Selecione abaixo no SELECT MENU quem você deseja adicionar ao ticket\n\n${dbEmojis.get(`2`)} Lembre-se, ao adicionar o membro, ele terá permissão de visualizar o ticket e será avisado no privado\n\n${dbEmojis.get(`1`)} Caso queira REMOVER do canal, use a opção REMOVER USUÁRIO`)
                            .setColor(dbConfigs.get(`ticket.color`))
                    ],
                    components: [select],
                    flags: MessageFlags.Ephemeral
                })
            }

            if (option === "remove_user_usuario") {
                const select = new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                            .setCustomId(`remove_user_usuariok`)
                            .setMaxValues(1)
                            .setPlaceholder(`Selecione um usuário...`),
                    )
                interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`${dbEmojis.get(`34`)}  Gerenciando Usuários no Ticket`)
                            .setDescription(`${dbEmojis.get(`29`)} Selecione abaixo no SELECT MENU quem você deseja remover ao ticket\n\n${dbEmojis.get(`2`)} Lembre-se, ao remover o membro, ele perderá permissão de visualizar o ticket e será avisado no privado\n\n${dbEmojis.get(`1`)} Caso queira ADICIONAR novamente ao canal, use a opção ADICIONAR USUÁRIO`)
                            .setColor(dbConfigs.get(`ticket.color`))
                    ],
                    components: [select],
                    flags: MessageFlags.Ephemeral
                })
            }
        }

        //Ticket Avaliar
        if (interaction.isButton()) {
            const option = interaction.customId;
            const tabom = option.split("_")[0];

            if (option.endsWith("_avalia_atendimentoo")) {
                const modal = new ModalBuilder().setCustomId(`${tabom}_modal_avalia`).setTitle("Avalie nosso atendimento")

                const text = new TextInputBuilder()
                    .setCustomId("numero_avalia")
                    .setLabel("Escolha de 1 a 5")
                    .setPlaceholder("Digite aqui ✏")
                    .setStyle(1)
                    .setMaxLength(1)
                    .setValue("5")
                const desc = new TextInputBuilder()
                    .setCustomId("desc_avalia")
                    .setLabel("Diga mais sobre o nosso atendimento")
                    .setPlaceholder("Digite aqui ✏")
                    .setStyle(1)
                    .setValue("Gostei muito do atendimendo, rapido e pratico")

                modal.addComponents(new ActionRowBuilder().addComponents(text))
                modal.addComponents(new ActionRowBuilder().addComponents(desc))

                return interaction.showModal(modal)
            }
        }

        if (interaction.isModalSubmit()) {
            const customId = interaction.customId
            const tabom = customId.split("_")[0];

            if (customId.endsWith("_modal_avalia")) {
                const tickets = dbDataTicket.get(`${tabom}`)

                if (!tickets) {
                    interaction.update({ content: `Falha no envio da sua avaliação!`, components: [] })
                    return
                };

                const text = interaction.fields.getTextInputValue("numero_avalia");
                const text2 = interaction.fields.getTextInputValue("desc_avalia");

                const canal_avalia = interaction.client.channels.cache.get(dbConfigs.get(`ticket.ticket.canal_avalia`))

                if (!canal_avalia) {
                    interaction.update({ content: `${dbEmojis.get(`13`)} | Canal de avaliações inválido!`, components: [] })
                    return;
                }

                let estrelas = "";
                if (text === "1") {
                    estrelas = "`⭐ (1/5)`"
                } else if (text === "2") {
                    estrelas = "`⭐⭐` (2/5)"
                } else if (text === "3") {
                    estrelas = "`⭐⭐⭐` (3/5)"
                } else if (text === "4") {
                    estrelas = "`⭐⭐⭐⭐` (4/5)"
                } else if (text === "5") {
                    estrelas = "`⭐⭐⭐⭐⭐` (5/5)"
                } else {
                    interaction.reply({ content: `${dbEmojis.get(`13`)} | Quantidade de estrelas inválida!`, flags: MessageFlags.Ephemeral })
                    return;
                }
                let staff;
                if (tickets.staff) {
                    staff = interaction.client.users.cache.get(tickets.staff)
                }
                const user = interaction.client.users.cache.get(tickets.usuario)
                const embed = new EmbedBuilder()
                    .setColor("Random")
                    .setAuthor({ name: `Nova Avaliação ⭐`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        {
                            name: `${dbEmojis.get(`32`)} | Avaliação enviada por:`,
                            value: `${user} - \`${tickets.usuario}\``,
                            inline: false
                        },
                        {
                            name: `${dbEmojis.get(`24`)} | Quem Assumiu:`,
                            value: `${staff || "Ninguém Assumiu"}`,
                            inline: false
                        },
                        {
                            name: `${dbEmojis.get(`28`)} | Avaliação:`,
                            value: `${estrelas}`,
                            inline: false
                        },
                        {
                            name: `${dbEmojis.get(`25`)} | Descrição:`,
                            value: `${text2 || "Não Escrita"}`,
                            inline: false
                        },
                        {
                            name: `${dbEmojis.get(`27`)} | Horário da Avaliação:`,
                            value: `<t:${Math.floor(new Date() / 1000)}:f> (<t:${~~(new Date() / 1000)}:R>)`,
                            inline: false
                        }
                    );

                await canal_avalia.send({ embeds: [embed], content: `<@${tickets.usuario}>` });
                await interaction.update({ components: [], content: `${dbEmojis.get(`6`)} | Avaliação enviada!` });

                try { dbDataTicket.delete(tabom) } catch (error) { }
            }
        }
    }
}