const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType } = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })
const dbTickets = new JsonDatabase({ databasePath: "./databases/tickets.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isStringSelectMenu() && interaction.customId === "select-config-painel") {
            const option = interaction.values[0]

            if (option === dbTickets.get(`${option}.idpainel`)) {
                if (dbTickets.get(`${option}.tipo`) === "button") {
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Configurando Painel`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                        .setColor(dbConfigs.get(`ticket.color`) || "Default")
                        .setDescription([
                            `${dbEmojis.get(`2`)} Selecione função que queira mudar com os botões logo abaixo.`,
                            `\u200b`,
                            `**Descrição do Painel:**`,
                            `${dbTickets.get(`${option}.desc`)}`
                        ].join('\n'))
                        .addFields(
                            {
                                name: `Nome do Painel:`,
                                value: `\`${option}\``,
                                inline: true
                            },
                            {
                                name: `Tipo do Painel:`,
                                value: `\`${dbTickets.get(`${option}.tipo`)}\``,
                                inline: true
                            },
                            {
                                name: `Categoria:`,
                                value: `${interaction.guild.channels.cache.get(dbTickets.get(`${option}.categoria`)) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                                inline: true
                            },
                            { name: ` `, value: ` `, inline: false },
                            {
                                name: `Título do Painel:`,
                                value: `${dbTickets.get(`${option}.title`)}`,
                                inline: false
                            }
                        )
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_title`)
                                .setLabel(`Mudar Título`)
                                .setEmoji("✏️"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_desc`)
                                .setLabel(`Mudar Descrição`)
                                .setEmoji("✏️"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_button_voltar`)
                                .setLabel(`Configurar Botão`)
                                .setEmoji("🔧"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_outrasconfig`)
                                .setLabel(`Outras Configurações`)
                                .setEmoji("🛠️"),
                            new ButtonBuilder()
                                .setStyle(3)
                                .setCustomId(`${option}_config_atualizar`)
                                .setLabel(`Atualizar Painel`)
                                .setEmoji("🔄"),
                        )
                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(1)
                                .setCustomId(`voltar_config`)
                                
                                .setEmoji("↩️"),
                            new ButtonBuilder()
                                .setStyle(4)
                                .setCustomId(`${option}_config_del`)
                                .setEmoji("🗑️")
                        )
                    interaction.update({ embeds: [embed], components: [row, row2] })
                } else if (dbTickets.get(`${option}.tipo`) === "select") {
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Configurando Painel`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                        .setColor(dbConfigs.get(`ticket.color`) || "Default")
                        .setDescription([
                            `${dbEmojis.get(`2`)} Selecione função que queira mudar com os botões logo abaixo.`,
                            `\u200b`,
                            `**Descrição do Painel:**`,
                            `${dbTickets.get(`${option}.desc`)}`
                        ].join('\n'))
                        .addFields(
                            {
                                name: `Nome do Painel:`,
                                value: `\`${option}\``,
                                inline: true
                            },
                            {
                                name: `Tipo do Painel:`,
                                value: `\`${dbTickets.get(`${option}.tipo`)}\``,
                                inline: true
                            },
                            {
                                name: `Título do Painel:`,
                                value: `${dbTickets.get(`${option}.title`)}`,
                                inline: false
                            }
                        )

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_title`)
                                .setLabel(`Mudar Título`)
                                .setEmoji("✏️"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_desc`)
                                .setLabel(`Mudar Descrição`)
                                .setEmoji("✏️"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_select`)
                                .setLabel(`Configurar Select`)
                                .setEmoji("🔧"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_outrasconfig`)
                                .setLabel(`Outras Configurações`)
                                .setEmoji("🛠️"),
                            new ButtonBuilder()
                                .setStyle(3)
                                .setCustomId(`${option}_config_atualizar`)
                                .setLabel(`Atualizar Painel`)
                                .setEmoji("🔄"),
                        )
                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(1)
                                .setCustomId(`voltar_config`)
                                
                                .setEmoji("↩️"),
                            new ButtonBuilder()
                                .setStyle(4)
                                .setCustomId(`${option}_config_del`)
                                .setEmoji("🗑️")
                        )
                    interaction.update({ embeds: [embed], components: [row, row2] })
                }
            }
        }

        if (interaction.isButton()) {
            const customId = interaction.customId;
            const tabom = customId.split("_")[0];
            const option = customId.split("_")[0];
            if (customId.endsWith("_config_outrasconfig")) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Outras Configurações`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Selecione abaixo as outras opções!`)
                    .addFields(
                        {
                            name: `Nome do Painel:`,
                            value: `\`${option}\``,
                            inline: true
                        },
                        {
                            name: `Tipo do Painel:`,
                            value: `\`${dbTickets.get(`${option}.tipo`)}\``,
                            inline: true
                        },
                    )
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(3)
                            .setCustomId(`${option}_config_modal`)
                            .setLabel(`Configurar Modais`)
                            .setEmoji("⚙️"),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${option}_config_imagens`)
                            .setLabel(`Mudar Imagens`)
                            .setEmoji("🖼️"),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${option}_config_modomsg`)
                            .setLabel(`Modo Mensagem`)
                            .setEmoji("📝"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_voltar`)
                            
                            .setEmoji("↩️")
                    )
                interaction.update({ embeds: [embed], components: [row] })
            }
            if (customId.endsWith("_config_modomsg")) {
                const modo = dbTickets.get(`${tabom}.modomsg`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Modo Mensagem`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`${dbEmojis.get(`2`)} Quando o modo é trocado para mensagem simples, a mensagem do painel deixa de ser **EMBED** e passa à ser uma **MENSAGEM** e apenas a descrição e imagem será setada no painel de criação do ticket. Esteja ciente disso.`)
                    .addFields(
                        {
                            name: `Modo Mensagem Simples:`,
                            value: `\`${modo}\``,
                            inline: true
                        },
                    )
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(dbTickets.get(`${option}.modomsg`) === "ON" ? 3 : 4)
                            .setCustomId(`${tabom}_modomsg_onoff`)
                            .setLabel(`Mensagem Simples`)
                            .setEmoji(dbTickets.get(`${option}.modomsg`) === "ON" ? "🟢" : "🔴"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_outrasconfig`)
                            
                            .setEmoji("🛠️")
                    )
                interaction.update({ embeds: [embed], components: [row] })
            }
            if (customId.endsWith("_modomsg_onoff")) {
                await dbTickets.get(`${tabom}.modomsg`) === "ON" ? await dbTickets.set(`${tabom}.modomsg`, "OFF") : await dbTickets.set(`${tabom}.modomsg`, "ON")
                const modo = dbTickets.get(`${tabom}.modomsg`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Modo Mensagem`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`${dbEmojis.get(`2`)} Quando o modo é trocado para mensagem simples, a mensagem do painel deixa de ser **EMBED** e passa à ser uma **MENSAGEM** e apenas a descrição e imagem será setada no painel de criação do ticket. Esteja ciente disso.`)
                    .addFields(
                        {
                            name: `Modo Mensagem Simples:`,
                            value: `\`${modo}\``,
                            inline: true
                        },
                    )
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(dbTickets.get(`${option}.modomsg`) === "ON" ? 3 : 4)
                            .setCustomId(`${tabom}_modomsg_onoff`)
                            .setLabel(`Mensagem Simples`)
                            .setEmoji(dbTickets.get(`${option}.modomsg`) === "ON" ? "🟢" : "🔴"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_outrasconfig`)
                            
                            .setEmoji("🛠️")
                    )
                interaction.update({ embeds: [embed], components: [row] })
            }

            if (customId.endsWith("_config_modal")) {
                await mesagemModais(interaction)
            }
            if (customId.endsWith("_modalassunto_onoff")) {
                await dbTickets.get(`${tabom}.modal.assunto`) === "ON" ? await dbTickets.set(`${tabom}.modal.assunto`, "OFF") : await dbTickets.set(`${tabom}.modal.assunto`, "ON")
                await mesagemModais(interaction)
            }
            if (customId.endsWith("_modaldesc_onoff")) {
                await dbTickets.get(`${option}.modal.desc`) === "ON" ? await dbTickets.set(`${option}.modal.desc`, "OFF") : await dbTickets.set(`${option}.modal.desc`, "ON")
                await mesagemModais(interaction)
            }
            if (customId.endsWith("_modalfinalization_onoff")) {
                await dbTickets.get(`${option}.modal.finaliza`) === "ON" ? await dbTickets.set(`${option}.modal.finaliza`, "OFF") : dbTickets.set(`${option}.modal.finaliza`, "ON")
                await mesagemModais(interaction)
            }
            async function mesagemModais(interaction) {
                const assunto = await dbTickets.get(`${tabom}.modal.assunto`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                const descticket = await dbTickets.get(`${tabom}.modal.desc`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                const motivofinaliza = await dbTickets.get(`${tabom}.modal.finaliza`) === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Configurando Sistemas`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Configure os sistemas de modais que serão perguntados nas criações dos Tickets!`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")
                    .addFields(
                        {
                            name: `Assunto Ticket:`,
                            value: `${assunto}`,
                            inline: false
                        },
                        {
                            name: `Descrição do Ticket:`,
                            value: `${descticket}`,
                            inline: false
                        },
                        {
                            name: `Motivo Finalização:`,
                            value: `${motivofinaliza}`,
                            inline: false
                        },
                    )

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(dbTickets.get(`${option}.modal.assunto`) === "ON" ? 3 : 4)
                            .setCustomId(`${tabom}_modalassunto_onoff`)
                            .setLabel(`Assunto do Ticket`)
                            .setEmoji(dbTickets.get(`${option}.modal.assunto`) === "ON" ? "🟢" : "🔴"),
                        new ButtonBuilder()
                            .setStyle(dbTickets.get(`${option}.modal.desc`) === "ON" ? 3 : 4)
                            .setCustomId(`${tabom}_modaldesc_onoff`)
                            .setLabel(`Descrição do ticket`)
                            .setEmoji(dbTickets.get(`${option}.modal.desc`) === "ON" ? "🟢" : "🔴"),
                        new ButtonBuilder()
                            .setStyle(dbTickets.get(`${option}.modal.finaliza`) === "ON" ? 3 : 4)
                            .setCustomId(`${tabom}_modalfinalization_onoff`)
                            .setLabel(`Finalização do ticket`)
                            .setEmoji(dbTickets.get(`${option}.modal.finaliza`) === "ON" ? "🟢" : "🔴"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_outrasconfig`)
                            
                            .setEmoji("🛠️")
                    )
                interaction.update({ embeds: [embed], components: [row] })
            }

            if (customId.endsWith('_config_select')) {
                const embed = new EmbedBuilder()
                    .setTitle(`Configurando Select.`)
                    .setDescription(`Selecione a opção de criação do ticket que deseja configurar`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")

                const actionrowselect = new StringSelectMenuBuilder()
                    .setCustomId('select_config_options')
                    .setPlaceholder("Selecione uma opção para configurar")

                const paineis = dbTickets.get(`${tabom}.select`);

                paineis.map((entry, index) => {
                    actionrowselect.addOptions(
                        {
                            label: `Texto: ${entry.text}`,
                            description: `ID: ${entry.id}`,
                            value: `${tabom}_${entry.id}`,
                            emoji: entry.emoji
                        }
                    )
                })

                const row = new ActionRowBuilder()
                    .addComponents(actionrowselect)

                const rowb = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(3)
                            .setCustomId(`${tabom}_add_option_select`)
                            .setLabel(`Add Nova Opção`)
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setStyle(4)
                            .setCustomId(`${tabom}_sub_option_select`)
                            .setLabel(`Remover Opção`)
                            .setEmoji("➖"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_voltar`)
                            
                            .setEmoji("↩️")
                    )
                interaction.update({ embeds: [embed], components: [row, rowb] })
            }
            if (customId.endsWith("_add_option_select")) {
                const painel = dbTickets.get(`${tabom}`)
                if (painel.select.length >= 15) {
                    interaction.reply({ content: `${dbEmojis.get(`13`)} | Máximo de 15 opções de select!`, flags: MessageFlags.Ephemeral })
                    return;
                }
                let id = await painel.select.length + 1
                await dbTickets.push(`${tabom}.select`, {
                    text: "Abrir Ticket",
                    desc: "Clique aqui para abrir",
                    emoji: `${dbEmojis.get(`26`)}`,
                    id: id,
                    msg: {
                        mensagem: "",
                        sistema: "ON"
                    }
                });
                const embed = new EmbedBuilder()
                    .setTitle(`Configurando Select.`)
                    .setDescription(`Selecione a opção de criação do ticket que deseja configurar`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")

                const actionrowselect = new StringSelectMenuBuilder()
                    .setCustomId('select_config_options')
                    .setPlaceholder("Selecione uma opção para configurar")

                const paineis = dbTickets.get(`${tabom}.select`);

                paineis.map((entry, index) => {
                    actionrowselect.addOptions(
                        {
                            label: `Texto: ${entry.text}`,
                            description: `ID: ${entry.id}`,
                            value: `${tabom}_${entry.id}`,
                            emoji: entry.emoji
                        }
                    )
                })

                const row = new ActionRowBuilder()
                    .addComponents(actionrowselect)

                const rowb = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(3)
                            .setCustomId(`${tabom}_add_option_select`)
                            .setLabel(`Add Nova Opção`)
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setStyle(4)
                            .setCustomId(`${tabom}_sub_option_select`)
                            .setLabel(`Remover Opção`)
                            .setEmoji("➖"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_voltar`)
                            
                            .setEmoji("↩️")
                    )
                interaction.message.edit({ embeds: [embed], components: [row, rowb] })
                interaction.reply({ content: `${dbEmojis.get(`6`)} | Nova opção adicionada com sucesso!`, flags: MessageFlags.Ephemeral })
            }
            if (customId.endsWith("_sub_option_select")) {
                interaction.deferUpdate();
                interaction.channel.send(`${dbEmojis.get(`16`)} | Mande o id da opção que será removida!`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", async (message) => {
                        const newt = message.content
                        message.delete()

                        const painel = dbTickets.get(`${tabom}`);

                        if (painel) {
                            if (painel.select && Array.isArray(painel.select)) {
                                if (painel.select.length <= 1) {
                                    msg12.edit(`${dbEmojis.get(`13`)} | É necessário conter pelo menos uma opção!`);
                                    return;
                                }
                                // Encontra a opção no array 'select' pelo ID
                                const opcaoDeletarIndex = painel.select.findIndex(opcao => opcao.id === Number(newt));
                                if (opcaoDeletarIndex !== -1) {
                                    // Remove a opção do array 'select' pelo índice encontrado
                                    painel.select.splice(opcaoDeletarIndex, 1);
                                    // Salva as alterações de volta na base de dados
                                    let idd = 1
                                    await painel.select.map(entry => {
                                        entry.id = idd
                                        idd++;
                                    })
                                    await dbTickets.set(tabom, painel);
                                    msg12.edit(`${dbEmojis.get(`6`)} | Opção deletado com sucesso!`).then(msg => {
                                        setTimeout(() => {
                                            msg.delete().catch(error => { })
                                        }, 5000);
                                    })
                                    const embed = new EmbedBuilder()
                                        .setTitle(`Configurando Select.`)
                                        .setDescription(`Selecione a opção de criação do ticket que deseja configurar`)
                                        .setColor(dbConfigs.get(`ticket.color`) || "Default")

                                    const actionrowselect = new StringSelectMenuBuilder()
                                        .setCustomId('select_config_options')
                                        .setPlaceholder("Selecione uma opção para configurar")

                                    const paineis = dbTickets.get(`${tabom}.select`);

                                    paineis.map((entry, index) => {
                                        actionrowselect.addOptions(
                                            {
                                                label: `Texto: ${entry.text}`,
                                                description: `ID: ${entry.id}`,
                                                value: `${tabom}_${entry.id}`,
                                                emoji: entry.emoji
                                            }
                                        )
                                    })

                                    const row = new ActionRowBuilder()
                                        .addComponents(actionrowselect)

                                    const rowb = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setStyle(3)
                                                .setCustomId(`${tabom}_add_option_select`)
                                                .setLabel(`Add Nova Opção`)
                                                .setEmoji("➕"),
                                            new ButtonBuilder()
                                                .setStyle(4)
                                                .setCustomId(`${tabom}_sub_option_select`)
                                                .setLabel(`Remover Opção`)
                                                .setEmoji("➖"),
                                            new ButtonBuilder()
                                                .setStyle(1)
                                                .setCustomId(`${tabom}_config_voltar`)
                                                
                                                .setEmoji("↩️")
                                        )
                                    interaction.message.edit({ embeds: [embed], components: [row, rowb] })
                                } else {
                                    msg12.edit(`${dbEmojis.get(`13`)} | Opção não encontrada!`).then(msg => {
                                        setTimeout(() => {
                                            msg.delete().catch(error => { })
                                        }, 5000);
                                    })
                                }
                            } else {
                                console.error("A propriedade 'select' não é um array válido.");
                            }
                        } else {
                            msg12.edit(`${dbEmojis.get(`13`)} | Painel não encontrado!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })
                        }
                    })
                })
            }
            if (customId.endsWith('_config_button_voltar')) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Configurando Botões`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Selecione abaixo qual botão você deseja configurar!`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")

                const actionrowselect = new StringSelectMenuBuilder()
                    .setCustomId('select_config_buttons')
                    .setPlaceholder("Selecione uma opção para configurar")
                let paineis = []
                paineis = dbTickets.get(`${tabom}.buttons`);

                paineis.map((entry, index) => {
                    actionrowselect.addOptions(
                        {
                            label: `Texto: ${entry.text}`,
                            description: `ID: ${entry.id}`,
                            value: `${tabom}_${entry.id}`,
                            emoji: entry.emoji
                        }
                    )
                })

                const row = new ActionRowBuilder()
                    .addComponents(actionrowselect)

                const rowb = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(3)
                            .setCustomId(`${tabom}_add_buttons`)
                            .setLabel(`Adicionar Botão`)
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setStyle(4)
                            .setCustomId(`${tabom}_sub_buttons`)
                            .setLabel(`Remover Botão`)
                            .setEmoji("➖"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_voltar`)
                            
                            .setEmoji("↩️")
                    )
                interaction.update({ embeds: [embed], components: [row, rowb] })
            }
            if (customId.endsWith("_add_buttons")) {
                let opc = []
                opc = dbTickets.get(`${tabom}.buttons`)
                if (opc.length >= 5) {
                    interaction.reply({ content: `${dbEmojis.get(`13`)} | Não é possível criar mais botões!`, flags: MessageFlags.Ephemeral })
                    return;
                }
                let idsn = opc.length + 1
                dbTickets.push(`${tabom}.buttons`, {
                    text: "Abrir Ticket",
                    style: 1,
                    emoji: `🎫`,
                    id: idsn,
                    msg: {
                        sistema: "OFF",
                        mensagem: ""
                    }
                });
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Configurando Botões`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Selecione abaixo qual botão você deseja configurar!`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")

                const actionrowselect = new StringSelectMenuBuilder()
                    .setCustomId('select_config_buttons')
                    .setPlaceholder("Selecione uma opção para configurar")
                let paineis = []
                paineis = dbTickets.get(`${tabom}.buttons`);

                paineis.map((entry, index) => {
                    actionrowselect.addOptions(
                        {
                            label: `Texto: ${entry.text}`,
                            description: `ID: ${entry.id}`,
                            value: `${tabom}_${entry.id}`,
                            emoji: entry.emoji
                        }
                    )
                })


                const row = new ActionRowBuilder()
                    .addComponents(actionrowselect)

                const rowb = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(3)
                            .setCustomId(`${tabom}_add_buttons`)
                            .setLabel(`Adicionar Botão`)
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setStyle(4)
                            .setCustomId(`${tabom}_sub_buttons`)
                            .setLabel(`Remover Botão`)
                            .setEmoji("➖"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_voltar`)
                            
                            .setEmoji("↩️")
                    )
                interaction.message.edit({ embeds: [embed], components: [row, rowb] })
                interaction.reply({ content: `${dbEmojis.get(`6`)} | Botão adicionado com sucesso!`, flags: MessageFlags.Ephemeral })
            }
            if (customId.endsWith("_sub_buttons")) {
                interaction.deferUpdate();
                interaction.channel.send(`${dbEmojis.get(`16`)} | Mande o id do botão que será removido!`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        const newt = message.content
                        message.delete();

                        const painel = dbTickets.get(`${tabom}`);

                        if (painel) {
                            if (painel.buttons && Array.isArray(painel.buttons)) {
                                if (painel.buttons.length <= 1) {
                                    msg12.edit(`${dbEmojis.get(`13`)} | Mínimo de opções atingida!`);
                                    return;
                                }
                                // Encontra a opção no array 'select' pelo ID
                                const opcaoDeletarIndex = painel.buttons.findIndex(opcao => opcao.id === Number(newt));
                                if (opcaoDeletarIndex !== -1) {
                                    // Remove a opção do array 'select' pelo índice encontrado
                                    painel.buttons.splice(opcaoDeletarIndex, 1);
                                    // Salva as alterações de volta na base de dados
                                    dbTickets.set(tabom, painel);
                                    msg12.edit(`${dbEmojis.get(`6`)} | Botão deletado com sucesso!`).then(msg => {
                                        setTimeout(() => {
                                            msg.delete().catch(error => { })
                                        }, 5000);
                                    })
                                    let idd = 1
                                    let buttons = []
                                    buttons = painel.buttons
                                    buttons.map(entry => {
                                        entry.id = idd
                                        idd++;
                                    })
                                    dbTickets.set(`${option}.buttons`, buttons)
                                    const embed = new EmbedBuilder()
                                        .setAuthor({ name: `Configurando Botões`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                        .setDescription(`Selecione abaixo qual botão você deseja configurar!`)
                                        .setColor(dbConfigs.get(`ticket.color`) || "Default")


                                    const actionrowselect = new StringSelectMenuBuilder()
                                        .setCustomId('select_config_buttons')
                                        .setPlaceholder("Selecione uma opção para configurar")
                                    let paineis = []
                                    paineis = dbTickets.get(`${tabom}.buttons`);

                                    paineis.map((entry, index) => {
                                        actionrowselect.addOptions(
                                            {
                                                label: `Texto: ${entry.text}`,
                                                description: `ID: ${entry.id}`,
                                                value: `${tabom}_${entry.id}`,
                                                emoji: entry.emoji
                                            }
                                        )
                                    })


                                    const row = new ActionRowBuilder()
                                        .addComponents(actionrowselect)

                                    const rowb = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setStyle(3)
                                                .setCustomId(`${tabom}_add_buttons`)
                                                .setLabel(`Adicionar Botão`)
                                                .setEmoji("➕"),
                                            new ButtonBuilder()
                                                .setStyle(4)
                                                .setCustomId(`${tabom}_sub_buttons`)
                                                .setLabel(`Remover Botão`)
                                                .setEmoji("➖"),
                                            new ButtonBuilder()
                                                .setStyle(1)
                                                .setCustomId(`${tabom}_config_voltar`)
                                                
                                                .setEmoji("↩️")
                                        )
                                    interaction.message.edit({ embeds: [embed], components: [row, rowb] })
                                } else {
                                    msg12.edit(`${dbEmojis.get(`13`)} | Botão não encontrado!`).then(msg => {
                                        setTimeout(() => {
                                            msg.delete().catch(error => { })
                                        }, 5000);
                                    })
                                }
                            } else {
                                console.error("A propriedade 'select' não é um array válido.");
                            }
                        } else {
                            msg12.edit(`${dbEmojis.get(`13`)} | Painel não encontrado!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })
                        }
                    })
                })
            }
            if (customId.endsWith('_configbutton_categoria')) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Botão`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Selecione abaixo a categoria que você quer para ser a de criação dos tickets.`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const select = new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setChannelTypes(ChannelType.GuildCategory)
                                    .setCustomId(`${tabom}_${entry.id}_button_category`)
                                    .setMaxValues(1)
                                    .setPlaceholder(`Selecione uma categoria...`),
                            )
                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_voltar_config_button`)
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [select, row] })
                    }
                })
            }
            if (customId.endsWith("_voltar_config_button")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let style = "";
                        if (entry.style === 1) {
                            style = "\`🔵 Azul - 1\`"
                        }
                        if (entry.style === 2) {
                            style = "\`⚫ Cinza - 2\`"
                        }
                        if (entry.style === 3) {
                            style = "\`🟢 Verde - 3\`"
                        }
                        if (entry.style === 4) {
                            style = "\`🔴 Vermelho - 4\`"
                        }
                        const categoria = interaction.guild.channels.cache.get(entry.categoria)


                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Botão (${tabom})`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Selecione abaixo qual botão você deseja configurar!`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Texto:`,
                                    value: `${entry.text}`,
                                    inline: true
                                },
                                {
                                    name: `Emoji:`,
                                    value: `${entry.emoji}`,
                                    inline: true
                                },
                                {
                                    name: `Cor:`,
                                    value: `${style}`,
                                    inline: true
                                },
                                {
                                    name: `Categoria:`,
                                    value: `${categoria || "\`Não Definido\`"}`,
                                    inline: true
                                }
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_text`)
                                    .setLabel(`Mudar Texto`)
                                    .setEmoji("✏️"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_emoji`)
                                    .setLabel(`Mudar Emoji`)
                                    .setEmoji("😀"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_cor`)
                                    .setLabel(`Mudar Cor`)
                                    .setEmoji(`🎨`),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_categoria`)
                                    .setLabel(`Mudar Categoria`)
                                    .setEmoji("🔧"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                    .setLabel(`Outras Opções`)
                                    .setEmoji("🛠️")
                            )
                        const row2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_config_button_voltar`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.deferUpdate();
                        interaction.message.edit({ embeds: [embed], components: [row, row2] })
                    }
                })
            }
            if (customId.endsWith('_configbutton_text')) {
                interaction.deferUpdate();
                interaction.channel.send(`${dbEmojis.get(`16`)} | Mande o novo texto do botão!`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        const newt = message.content
                        if (newt.length > 80) {
                            message.delete()
                            msg12.edit({ content: `${dbEmojis.get(`13`)} | A descrição não pode ser maior que **80** caracteres! Tente novamente.` }).then(() => {
                                setTimeout(() => {
                                    msg12.delete().catch(error => { })
                                }, 5000);
                            })
                        } else {
                            message.delete();
                            const id = customId.split("_")[1]
                            let buttonss = dbTickets.get(`${tabom}.buttons`) || [];
                            let elementIndex = id - 1

                            buttonss[elementIndex].text = newt;
                            dbTickets.set(`${tabom}.buttons`, buttonss)
                            msg12.edit(`${dbEmojis.get(`6`)} | Alterado com sucesso!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })

                            buttonss = dbTickets.get(`${tabom}.buttons`)
                            let entry = buttonss[elementIndex]
                            let style = "";
                            buttonss.map(entry => {
                                if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                                    let style = "";
                                    if (entry.style === 1) {
                                        style = "\`🔵 Azul - 1\`"
                                    }
                                    if (entry.style === 2) {
                                        style = "\`⚫ Cinza - 2\`"
                                    }
                                    if (entry.style === 3) {
                                        style = "\`🟢 Verde - 3\`"
                                    }
                                    if (entry.style === 4) {
                                        style = "\`🔴 Vermelho - 4\`"
                                    }
                                    const categoria = interaction.guild.channels.cache.get(entry.categoria)
                                    const embed = new EmbedBuilder()
                                        .setAuthor({ name: `Configurando Botão (${tabom})`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                        .setDescription(`Selecione abaixo qual botão você deseja configurar!`)
                                        .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                        .addFields(
                                            {
                                                name: `Texto:`,
                                                value: `${entry.text}`,
                                                inline: true
                                            },
                                            {
                                                name: `Emoji:`,
                                                value: `${entry.emoji}`,
                                                inline: true
                                            },
                                            {
                                                name: `Cor:`,
                                                value: `${style}`,
                                                inline: true
                                            },
                                            {
                                                name: `Categoria:`,
                                                value: `${categoria || "\`Não Definido\`"}`,
                                                inline: true
                                            }
                                        )

                                    const row = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setStyle(2)
                                                .setCustomId(`${tabom}_${entry.id}_configbutton_text`)
                                                .setLabel(`Mudar Texto`)
                                                .setEmoji("✏️"),
                                            new ButtonBuilder()
                                                .setStyle(2)
                                                .setCustomId(`${tabom}_${entry.id}_configbutton_emoji`)
                                                .setLabel(`Mudar Emoji`)
                                                .setEmoji("😀"),
                                            new ButtonBuilder()
                                                .setStyle(2)
                                                .setCustomId(`${tabom}_${entry.id}_configbutton_cor`)
                                                .setLabel(`Mudar Cor`)
                                                .setEmoji(`🎨`),
                                            new ButtonBuilder()
                                                .setStyle(2)
                                                .setCustomId(`${tabom}_${entry.id}_configbutton_categoria`)
                                                .setLabel(`Mudar Categoria`)
                                                .setEmoji("🔧"),
                                            new ButtonBuilder()
                                                .setStyle(2)
                                                .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                                .setLabel(`Outras Opções`)
                                                .setEmoji("⚙️")
                                        )
                                    const row2 = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setStyle(1)
                                                .setCustomId(`${tabom}_config_button_voltar`)
                                                
                                                .setEmoji("↩️")
                                        )
                                    interaction.message.edit({ embeds: [embed], components: [row, row2] })
                                }
                            })
                        }
                    })
                })
            }
            if (customId.endsWith('_configbutton_cor')) {
                const id = customId.split("_")[0]
                interaction.deferUpdate();
                interaction.channel.send(`${dbEmojis.get(`16`)} | Mande a nova cor com os seguintes IDS definindo a cor:\n\n\`Azul = 1\`\n\`Cinza = 2\`\n\`Verde = 3\`\n\`Vermelho = 4\``).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        const newt = message.content
                        message.delete();
                        const numero = parseInt(newt);

                        const id = customId.split("_")[1]
                        let buttonss = dbTickets.get(`${tabom}.buttons`) || [];
                        let elementIndex = id - 1

                        switch (numero) {
                            case 1:
                                if (elementIndex !== -1) {
                                    // Edita o elemento conforme necessário
                                    buttonss[elementIndex].style = numero;
                                }
                                dbTickets.set(`${tabom}.buttons`, buttonss)
                                msg12.edit(`${dbEmojis.get(`6`)} | Alterado com sucesso!`).then(msg => {
                                    setTimeout(() => {
                                        msg.delete().catch(error => { })
                                    }, 5000);
                                })
                                break;
                            case 2:
                                if (elementIndex !== -1) {
                                    // Edita o elemento conforme necessário
                                    buttonss[elementIndex].style = numero;
                                }
                                dbTickets.set(`${tabom}.buttons`, buttonss)
                                msg12.edit(`${dbEmojis.get(`6`)} | Alterado com sucesso!`).then(msg => {
                                    setTimeout(() => {
                                        msg.delete().catch(error => { })
                                    }, 5000);
                                })
                                break;
                            case 3:
                                if (elementIndex !== -1) {
                                    // Edita o elemento conforme necessário
                                    buttonss[elementIndex].style = numero;
                                }
                                dbTickets.set(`${tabom}.buttons`, buttonss)
                                msg12.edit(`${dbEmojis.get(`6`)} | Alterado com sucesso!`).then(msg => {
                                    setTimeout(() => {
                                        msg.delete().catch(error => { })
                                    }, 5000);
                                })
                                break;
                            case 4:
                                if (elementIndex !== -1) {
                                    // Edita o elemento conforme necessário
                                    buttonss[elementIndex].style = numero;
                                }
                                dbTickets.set(`${tabom}.buttons`, buttonss)
                                msg12.edit(`${dbEmojis.get(`6`)} | Alterado com sucesso!`).then(msg => {
                                    setTimeout(() => {
                                        msg.delete().catch(error => { })
                                    }, 5000);
                                })
                                break;
                            default:
                                msg12.edit(`${dbEmojis.get(`13`)} | Coloque um número válido!`).then(msg => {
                                    setTimeout(() => {
                                        msg.delete().catch(error => { })
                                    }, 5000);
                                })
                        }
                        const buttons = dbTickets.get(`${tabom}.buttons`)
                        let entry = buttons[id]
                        let style = "";
                        buttons.map(entry => {
                            if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                                let style = "";
                                if (entry.style === 1) {
                                    style = "\`🔵 Azul - 1\`"
                                }
                                if (entry.style === 2) {
                                    style = "\`⚫ Cinza - 2\`"
                                }
                                if (entry.style === 3) {
                                    style = "\`🟢 Verde - 3\`"
                                }
                                if (entry.style === 4) {
                                    style = "\`🔴 Vermelho - 4\`"
                                }
                                const categoria = interaction.guild.channels.cache.get(entry.categoria)
                                const embed = new EmbedBuilder()
                                    .setAuthor({ name: `Configurando Botão (${tabom})`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                    .setDescription(`Selecione abaixo qual botão você deseja configurar!`)
                                    .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                    .addFields(
                                        {
                                            name: `Texto:`,
                                            value: `${entry.text}`,
                                            inline: true
                                        },
                                        {
                                            name: `Emoji:`,
                                            value: `${entry.emoji}`,
                                            inline: true
                                        },
                                        {
                                            name: `Cor:`,
                                            value: `${style}`,
                                            inline: true
                                        },
                                        {
                                            name: `Categoria:`,
                                            value: `${categoria || "\`Não Definido\`"}`,
                                            inline: true
                                        }
                                    )

                                const row = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_text`)
                                            .setLabel(`Mudar Texto`)
                                            .setEmoji("✏️"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_emoji`)
                                            .setLabel(`Mudar Emoji`)
                                            .setEmoji("😀"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_cor`)
                                            .setLabel(`Mudar Cor`)
                                            .setEmoji(`🎨`),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_categoria`)
                                            .setLabel(`Mudar Categoria`)
                                            .setEmoji("🔧"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                            .setLabel(`Outras Opções`)
                                            .setEmoji("⚙️")
                                    )
                                const row2 = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(1)
                                            .setCustomId(`${tabom}_config_button_voltar`)
                                            
                                            .setEmoji("↩️")
                                    )
                                interaction.message.edit({ embeds: [embed], components: [row, row2] })
                            }
                        })
                    })
                })
            }
            if (customId.endsWith('_configbutton_emoji')) {
                interaction.deferUpdate();
                interaction.channel.send(`${dbEmojis.get(`16`)} | Mande o novo emoji do botão!`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        const newt = message.content
                        message.delete();
                        const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
                        const id = customId.split("_")[1]
                        let buttonss = dbTickets.get(`${tabom}.buttons`) || [];
                        let elementIndex = id - 1

                        dbTickets.set(`${tabom}.buttons`, buttonss)
                        if (newt.startsWith('<')) {
                            if (elementIndex !== -1) {
                                buttonss[elementIndex].emoji = newt;
                            }
                            buttonss[elementIndex].emoji = newt;
                            dbTickets.set(`${tabom}.buttons`, buttonss)
                            msg12.edit(`${dbEmojis.get(`6`)} | Alterado com sucesso!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })
                        } else if (emojiRegex.test(newt)) {
                            if (elementIndex !== -1) {
                                buttonss[elementIndex].emoji = newt;
                            }
                            buttonss[elementIndex].emoji = newt;
                            dbTickets.set(`${tabom}.buttons`, buttonss)
                            msg12.edit(`${dbEmojis.get(`6`)} | Alterado com sucesso!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })
                        } else {
                            msg12.edit(`${dbEmojis.get(`13`)} | Emoji inválido!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })
                        }
                        const buttons = dbTickets.get(`${tabom}.buttons`)
                        let entry = buttons[id]
                        let style = "";
                        buttons.map(entry => {
                            if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                                let style = "";
                                if (entry.style === 1) {
                                    style = "\`🔵 Azul - 1\`"
                                }
                                if (entry.style === 2) {
                                    style = "\`⚫ Cinza - 2\`"
                                }
                                if (entry.style === 3) {
                                    style = "\`🟢 Verde - 3\`"
                                }
                                if (entry.style === 4) {
                                    style = "\`🔴 Vermelho - 4\`"
                                }
                                const categoria = interaction.guild.channels.cache.get(entry.categoria)
                                const embed = new EmbedBuilder()
                                    .setAuthor({ name: `Configurando Botão (${tabom})`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                    .setDescription(`Selecione abaixo qual botão você deseja configurar!`)
                                    .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                    .addFields(
                                        {
                                            name: `Texto:`,
                                            value: `${entry.text}`,
                                            inline: true
                                        },
                                        {
                                            name: `Emoji:`,
                                            value: `${entry.emoji}`,
                                            inline: true
                                        },
                                        {
                                            name: `Cor:`,
                                            value: `${style}`,
                                            inline: true
                                        },
                                        {
                                            name: `Categoria:`,
                                            value: `${categoria || "\`Não Definido\`"}`,
                                            inline: true
                                        }
                                    )

                                const row = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_text`)
                                            .setLabel(`Mudar Texto`)
                                            .setEmoji("✏️"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_emoji`)
                                            .setLabel(`Mudar Emoji`)
                                            .setEmoji("😀"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_cor`)
                                            .setLabel(`Mudar Cor`)
                                            .setEmoji(`🎨`),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_categoria`)
                                            .setLabel(`Mudar Categoria`)
                                            .setEmoji("🔧"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                            .setLabel(`Outras Opções`)
                                            .setEmoji("⚙️")
                                    )
                                const row2 = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(1)
                                            .setCustomId(`${tabom}_config_button_voltar`)
                                            
                                            .setEmoji("↩️")
                                    )
                                interaction.message.edit({ embeds: [embed], components: [row, row2] })
                            }
                        })
                    })
                })
            }
            if (customId.endsWith("_configbutton_outrasopc")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Outras Configurações`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Selecione abaixo as outras opções!`)
                            .addFields()
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modais`)
                                    .setLabel("Configurar Modais")
                                    .setEmoji("🔧"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto`)
                                    .setLabel("Mensagem Automática")
                                    .setEmoji("📝"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_voltar_config_button`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configbutton_modais")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const assunto = entry.assunto === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const descticket = entry.desc === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const motivofinaliza = entry.finaliza === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Modais`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure os sistemas de modais que serão perguntados nas criações dos Tickets!`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Assunto Ticket:`,
                                    value: `${assunto}`,
                                    inline: false
                                },
                                {
                                    name: `Descrição do Ticket:`,
                                    value: `${descticket}`,
                                    inline: false
                                },
                                {
                                    name: `Motivo Finalização:`,
                                    value: `${motivofinaliza}`,
                                    inline: false
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.assunto === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modalassunto`)
                                    .setLabel(`Assunto do Ticket`)
                                    .setEmoji(entry.assunto === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.desc === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modaldesc`)
                                    .setLabel(`Descrição do ticket`)
                                    .setEmoji(entry.desc === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.finaliza === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modalfinalization`)
                                    .setLabel(`Finalização do ticket`)
                                    .setEmoji(entry.finaliza === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configbutton_msgauto")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Mensagem Automática`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure a mensagem automática que será disparada após o usuário abrir o ticket.`)
                            .addFields(
                                {
                                    name: `Mensagem:`,
                                    value: `${entry.msg.mensagem || "`Mensagem Padrão`"}`,
                                    inline: true
                                },
                                {
                                    name: `Sistema:`,
                                    value: `${entry.msg.sistema === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`,
                                    inline: true
                                }
                            )
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.msg.sistema === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto_onoff`)
                                    .setLabel(entry.msg.sistema === "ON" ? "Sistema (Ligado)" : "Sistema (Desligado)")
                                    .setEmoji(entry.msg.sistema === "ON" ? "<:on_mt:1232722645238288506>" : "<:off:1243274635748048937>"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto_alt`)
                                    .setLabel("Mensagem ")
                                    .setEmoji("📝"),
                                new ButtonBuilder()
                                    .setStyle(4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msg_reset`)
                                    .setLabel("Resetar")
                                    .setEmoji("⚠️"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configbutton_msgauto_onoff")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        if (entry.msg.sistema === "ON") {
                            buttons[id].msg.sistema = "OFF"
                        } else {
                            buttons[id].msg.sistema = "ON"
                        }
                        dbTickets.set(`${tabom}.buttons`, buttons)
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Mensagem Automática`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure a mensagem automática que será disparada após o usuário abrir o ticket.`)
                            .addFields(
                                {
                                    name: `Mensagem:`,
                                    value: `${entry.msg.mensagem || "`Mensagem Padrão`"}`,
                                    inline: true
                                },
                                {
                                    name: `Sistema:`,
                                    value: `${entry.msg.sistema === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`,
                                    inline: true
                                }
                            )
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.msg.sistema === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto_onoff`)
                                    .setLabel(entry.msg.sistema === "ON" ? "Sistema (Ligado)" : "Sistema (Desligado)")
                                    .setEmoji(entry.msg.sistema === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto_alt`)
                                    .setLabel("Mensagem ")
                                    .setEmoji("✏️"),
                                new ButtonBuilder()
                                    .setStyle(4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msg_reset`)
                                    .setLabel("Resetar")
                                    .setEmoji("⚠️"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith(`_configbutton_msg_reset`)) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        buttons[id].msg.mensagem = ""
                        buttons[id].msg.sistema = "OFF"
                        dbTickets.set(`${tabom}.buttons`, buttons)
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Mensagem Automática`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure a mensagem automática que será disparada após o usuário abrir o ticket.`)
                            .addFields(
                                {
                                    name: `Mensagem:`,
                                    value: `${entry.msg.mensagem || "`Mensagem Padrão`"}`,
                                    inline: true
                                },
                                {
                                    name: `Sistema:`,
                                    value: `${entry.msg.sistema === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`,
                                    inline: true
                                }
                            )
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.msg.sistema === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto_onoff`)
                                    .setLabel(entry.msg.sistema === "ON" ? "Sistema (Ligado)" : "Sistema (Desligado)")
                                    .setEmoji(entry.msg.sistema === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto_alt`)
                                    .setLabel("Mensagem ")
                                    .setEmoji("📝"),
                                new ButtonBuilder()
                                    .setStyle(4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msg_reset`)
                                    .setLabel("Resetar")
                                    .setEmoji("⚠️"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configbutton_msgauto_alt")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const modal = new ModalBuilder()
                            .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto_alt_modal`)
                            .setTitle("Alterar Mensagem Automática")

                        const text = new TextInputBuilder()
                            .setCustomId("text_modal")
                            .setLabel("Coloque a nova mensagem")
                            .setPlaceholder("Digite aqui ✏")
                            .setStyle(2)
                            .setValue(entry.msg.mensagem)

                        modal.addComponents(new ActionRowBuilder().addComponents(text))

                        interaction.showModal(modal)
                    }
                })
            }
            if (customId.endsWith("_configbutton_modalfinalization")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        if (entry.finaliza === "ON") {
                            buttons[id].finaliza = "OFF"
                            dbTickets.set(`${tabom}.buttons`, buttons)
                        } else {
                            buttons[id].finaliza = "ON"
                            dbTickets.set(`${tabom}.buttons`, buttons)
                        }
                        const assunto = entry.assunto === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const descticket = entry.desc === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const motivofinaliza = entry.finaliza === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Modais`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure os sistemas de modais que serão perguntados nas criações dos Tickets!`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Assunto Ticket:`,
                                    value: `${assunto}`,
                                    inline: false
                                },
                                {
                                    name: `Descrição do Ticket:`,
                                    value: `${descticket}`,
                                    inline: false
                                },
                                {
                                    name: `Motivo Finalização:`,
                                    value: `${motivofinaliza}`,
                                    inline: false
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.assunto === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modalassunto`)
                                    .setLabel(`Assunto do Ticket`)
                                    .setEmoji(entry.assunto === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.desc === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modaldesc`)
                                    .setLabel(`Descrição do ticket`)
                                    .setEmoji(entry.desc === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.finaliza === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modalfinalization`)
                                    .setLabel(`Finalização do ticket`)
                                    .setEmoji(entry.finaliza === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configbutton_modaldesc")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        if (entry.desc === "ON") {
                            buttons[id].desc = "OFF"
                            dbTickets.set(`${tabom}.buttons`, buttons)
                        } else {
                            buttons[id].desc = "ON"
                            dbTickets.set(`${tabom}.buttons`, buttons)
                        }
                        const assunto = entry.assunto === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const descticket = entry.desc === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const motivofinaliza = entry.finaliza === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Modais`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure os sistemas de modais que serão perguntados nas criações dos Tickets!`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Assunto Ticket:`,
                                    value: `${assunto}`,
                                    inline: false
                                },
                                {
                                    name: `Descrição do Ticket:`,
                                    value: `${descticket}`,
                                    inline: false
                                },
                                {
                                    name: `Motivo Finalização:`,
                                    value: `${motivofinaliza}`,
                                    inline: false
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.assunto === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modalassunto`)
                                    .setLabel(`Assunto do Ticket`)
                                    .setEmoji(entry.assunto === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.desc === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modaldesc`)
                                    .setLabel(`Descrição do ticket`)
                                    .setEmoji(entry.desc === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.finaliza === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modalfinalization`)
                                    .setLabel(`Finalização do ticket`)
                                    .setEmoji(entry.finaliza === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configbutton_modalassunto")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        if (entry.assunto === "ON") {
                            buttons[id].assunto = "OFF"
                            dbTickets.set(`${tabom}.buttons`, buttons)
                        } else {
                            buttons[id].assunto = "ON"
                            dbTickets.set(`${tabom}.buttons`, buttons)
                        }
                        const assunto = entry.assunto === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const descticket = entry.desc === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const motivofinaliza = entry.finaliza === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Modais`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure os sistemas de modais que serão perguntados nas criações dos Tickets!`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Assunto Ticket:`,
                                    value: `${assunto}`,
                                    inline: false
                                },
                                {
                                    name: `Descrição do Ticket:`,
                                    value: `${descticket}`,
                                    inline: false
                                },
                                {
                                    name: `Motivo Finalização:`,
                                    value: `${motivofinaliza}`,
                                    inline: false
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.assunto === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modalassunto`)
                                    .setLabel(`Assunto do Ticket`)
                                    .setEmoji(entry.assunto === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.desc === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modaldesc`)
                                    .setLabel(`Descrição do ticket`)
                                    .setEmoji(entry.desc === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.finaliza === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_modalfinalization`)
                                    .setLabel(`Finalização do ticket`)
                                    .setEmoji(entry.finaliza === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith('_config_del')) {
                interaction.deferUpdate();
                dbTickets.delete(`${tabom}`)
                interaction.message.delete()
                interaction.channel.send(`${dbEmojis.get(`6`)} | Deletado com sucesso!`).then(msg => {
                    setTimeout(() => {
                        msg.delete().catch(error => { })
                    }, 5000);
                })
            }
            if (customId.endsWith('_config_imagens')) {
                await dbTickets.get(`${tabom}.banner`)


                let banner = "";
                if (dbTickets.get(`${tabom}.banner`)) {
                    banner = `[Clique aqui para ver](${dbTickets.get(`${tabom}.banner`)})`
                } else {
                    banner = "\`Não Definido\`"
                }
                let thumb = "";
                if (dbTickets.get(`${tabom}.thumb`)) {
                    thumb = `[Clique aqui para ver](${dbTickets.get(`${tabom}.thumb`)})`
                } else {
                    thumb = "\`Não Definido\`"
                }
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Configurando Imagens`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Envie o link das imagens para as modificações serem armazenadas.`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")
                    .addFields(
                        {
                            name: `Banner:`,
                            value: `${banner}`,
                            inline: true
                        },
                        {
                            name: `Thumbnail`,
                            value: `${thumb}`,
                            inline: true
                        }
                    )

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${tabom}_config_banner`)
                            .setLabel(`Mudar Banner`),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${tabom}_config_thumb`)
                            .setLabel(`Mudar Thumbnaill`),
                        new ButtonBuilder()
                            .setStyle(4)
                            .setCustomId(`${tabom}_configimg_reset`)
                            .setLabel(`Resetar`)
                            .setEmoji("⚠️"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_outrasconfig`)
                            
                            .setEmoji("↩️")
                    )

                interaction.update({ embeds: [embed], components: [row] })
            }
            if (customId.endsWith('_configimg_reset')) {
                interaction.deferUpdate();

                if (dbTickets.get(`${tabom}.banner`)) {
                    dbTickets.delete(`${tabom}.banner`)
                }
                if (dbTickets.get(`${tabom}.thumb`)) {
                    dbTickets.delete(`${tabom}.thumb`)
                }
                let banner = "";
                if (dbTickets.get(`${tabom}.banner`)) {
                    banner = `[Clique aqui para ver](${dbTickets.get(`${tabom}.banner`)})`
                } else {
                    banner = "\`Não Definido\`"
                }
                let thumb = "";
                if (dbTickets.get(`${tabom}.thumb`)) {
                    thumb = `[Clique aqui para ver](${dbTickets.get(`${tabom}.thumb`)})`
                } else {
                    thumb = "\`Não Definido\`"
                }
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Configurando Imagens`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Envie o link das imagens para as modificações serem armazenadas.`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")
                    .addFields(
                        {
                            name: `Banner:`,
                            value: `${banner}`,
                            inline: true
                        },
                        {
                            name: `Thumbnail`,
                            value: `${thumb}`,
                            inline: true
                        }
                    )

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${tabom}_config_banner`)
                            .setLabel(`Mudar Banner`),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${tabom}_config_thumb`)
                            .setLabel(`Mudar Thumbnaill`),
                        new ButtonBuilder()
                            .setStyle(4)
                            .setCustomId(`${tabom}_configimg_reset`)
                            .setLabel(`Resetar`)
                            .setEmoji("⚠️"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_outrasconfig`)
                            
                            .setEmoji("↩️")
                    )
                interaction.message.edit({ embeds: [embed], components: [row] })

                interaction.channel.send(`${dbEmojis.get(`6`)} | Resetado com sucesso!`).then((editedMessage) => {
                    setTimeout(() => {
                        editedMessage.delete().catch(error => { });
                    }, 5000);
                });
            }
            if (customId.endsWith('_config_banner')) {
                interaction.deferUpdate();
                interaction.channel.send(`${dbEmojis.get(`16`)} | Mande o link do banner aqui no chat!`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        message.delete()
                        if (message.content.startsWith('https://')) {
                            dbTickets.set(`${tabom}.banner`, `${message.content}`)

                            msg12.edit(`${dbEmojis.get(`6`)} | Alterado!`).then((editedMessage) => {
                                setTimeout(() => {
                                    editedMessage.delete().catch(error => { });
                                }, 5000);
                            });
                            let banner = "";
                            if (dbTickets.get(`${tabom}.banner`)) {
                                banner = `[Clique aqui para ver](${dbTickets.get(`${tabom}.banner`)})`
                            } else {
                                banner = "\`Não Definido\`"
                            }
                            let thumb = "";
                            if (dbTickets.get(`${tabom}.thumb`)) {
                                thumb = `[Clique aqui para ver](${dbTickets.get(`${tabom}.thumb`)})`
                            } else {
                                thumb = "\`Não Definido\`"
                            }
                            const embed = new EmbedBuilder()
                                .setAuthor({ name: `Configurando Imagens`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                .setDescription(`Envie o link das imagens para as modificações serem armazenadas.`)
                                .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                .addFields(
                                    {
                                        name: `Banner:`,
                                        value: `${banner}`,
                                        inline: true
                                    },
                                    {
                                        name: `Thumbnail`,
                                        value: `${thumb}`,
                                        inline: true
                                    }
                                )

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${tabom}_config_banner`)
                                        .setLabel(`Mudar Banner`),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${tabom}_config_thumb`)
                                        .setLabel(`Mudar Thumbnaill`),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`${tabom}_configimg_reset`)
                                        .setLabel(`Resetar`)
                                        .setEmoji("⚠️"),
                                    new ButtonBuilder()
                                        .setStyle(1)
                                        .setCustomId(`${tabom}_config_outrasconfig`)
                                        
                                        .setEmoji("↩️")
                                )

                            interaction.message.edit({ embeds: [embed], components: [row] })
                        } else {
                            msg12.edit(`${dbEmojis.get(`13`)} | Envie um link válido!`).then((editedMessage) => {
                                setTimeout(() => {
                                    editedMessage.delete().catch(error => { });
                                }, 5000);
                            });
                        }


                    })
                })
            }
            if (customId.endsWith('_config_thumb')) {
                interaction.deferUpdate();
                interaction.channel.send(`${dbEmojis.get(`16`)} | Mande o link da thumb aqui no chat!`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        message.delete()
                        if (message.content.startsWith('https://')) {
                            dbTickets.set(`${tabom}.thumb`, `${message.content}`)

                            msg12.edit(`${dbEmojis.get(`6`)} | Alterado!`).then((editedMessage) => {
                                setTimeout(() => {
                                    editedMessage.delete().catch(error => { });
                                }, 5000);
                            });
                            let banner = "";
                            if (dbTickets.get(`${tabom}.banner`)) {
                                banner = `[Clique aqui para ver](${dbTickets.get(`${tabom}.banner`)})`
                            } else {
                                banner = "\`Não Definido\`"
                            }
                            let thumb = "";
                            if (dbTickets.get(`${tabom}.thumb`)) {
                                thumb = `[Clique aqui para ver](${dbTickets.get(`${tabom}.thumb`)})`
                            } else {
                                thumb = "\`Não Definido\`"
                            }
                            const embed = new EmbedBuilder()
                                .setAuthor({ name: `Configurando Imagens`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                .setDescription(`Envie o link das imagens para as modificações serem armazenadas.`)
                                .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                .addFields(
                                    {
                                        name: `Banner:`,
                                        value: `${banner}`,
                                        inline: true
                                    },
                                    {
                                        name: `Thumbnail`,
                                        value: `${thumb}`,
                                        inline: true
                                    }
                                )

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${tabom}_config_banner`)
                                        .setLabel(`Mudar Banner`),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${tabom}_config_thumb`)
                                        .setLabel(`Mudar Thumbnaill`),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`${tabom}_configimg_reset`)
                                        .setLabel(`Resetar`)
                                        .setEmoji("<a:load:1241739159375188099>"),
                                    new ButtonBuilder()
                                        .setStyle(1)
                                        .setCustomId(`${tabom}_config_outrasconfig`)
                                        
                                        .setEmoji("<:emoji_6:1239445960447361085>")
                                )
                            interaction.message.edit({ embeds: [embed], components: [row] })
                        } else {
                            msg12.edit(`${dbEmojis.get(`13`)} | Envie um link válido!`).then((editedMessage) => {
                                setTimeout(() => {
                                    editedMessage.delete().catch(error => { });
                                }, 5000);
                            });
                        }


                    })
                })
            }
            if (customId.endsWith('_config_voltar')) {
                if (dbTickets.get(`${option}.tipo`) === "button") {
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Configurando Painel`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                        .setColor(dbConfigs.get(`ticket.color`) || "Default")
                        .setDescription([
                            `${dbEmojis.get(`2`)} Selecione função que queira mudar com os botões logo abaixo.`,
                            `\u200b`,
                            `**Descrição do Painel:**`,
                            `${dbTickets.get(`${option}.desc`)}`
                        ].join('\n'))
                        .addFields(
                            {
                                name: `Nome do Painel:`,
                                value: `\`${option}\``,
                                inline: true
                            },
                            {
                                name: `Tipo do Painel:`,
                                value: `\`${dbTickets.get(`${option}.tipo`)}\``,
                                inline: true
                            },
                            {
                                name: `Categoria:`,
                                value: `${interaction.guild.channels.cache.get(dbTickets.get(`${option}.categoria`)) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                                inline: true
                            },
                            { name: ` `, value: ` `, inline: false },
                            {
                                name: `Título do Painel:`,
                                value: `${dbTickets.get(`${option}.title`)}`,
                                inline: false
                            }
                        )
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_title`)
                                .setLabel(`Mudar Título`)
                                .setEmoji("<:prancheta:1243267310576341042>"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_desc`)
                                .setLabel(`Mudar Descrição`)
                                .setEmoji("<:copy7:1225478184330596575>"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_button_voltar`)
                                .setLabel(`Configurar Botão`)
                                .setEmoji("<:gerenciar:1239447347055034421>"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_outrasconfig`)
                                .setLabel(`Outras Configurações`)
                                .setEmoji("<:1166960895201656852:1239447582464282674>"),
                            new ButtonBuilder()
                                .setStyle(3)
                                .setCustomId(`${option}_config_atualizar`)
                                .setLabel(`Atualizar Painel`)
                                .setEmoji("<a:load:1225477784743186472>"),
                        )
                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(1)
                                .setCustomId(`voltar_config`)
                                
                                .setEmoji("<:emoji_6:1239445960447361085>"),
                            new ButtonBuilder()
                                .setStyle(4)
                                .setCustomId(`${option}_config_del`)
                                .setEmoji("<:1166960963988230195:1239447625737048154>")
                        )
                    interaction.update({ embeds: [embed], components: [row, row2] })
                } else if (dbTickets.get(`${option}.tipo`) === "select") {
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Configurando Painel`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                        .setColor(dbConfigs.get(`ticket.color`) || "Default")
                        .setDescription([
                            `${dbEmojis.get(`2`)} Selecione função que queira mudar com os botões logo abaixo.`,
                            `\u200b`,
                            `**Descrição do Painel:**`,
                            `${dbTickets.get(`${option}.desc`)}`
                        ].join('\n'))
                        .addFields(
                            {
                                name: `Nome do Painel:`,
                                value: `\`${option}\``,
                                inline: true
                            },
                            {
                                name: `Tipo do Painel:`,
                                value: `\`${dbTickets.get(`${option}.tipo`)}\``,
                                inline: true
                            },
                            {
                                name: `Título do Painel:`,
                                value: `${dbTickets.get(`${option}.title`)}`,
                                inline: false
                            }
                        )

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_title`)
                                .setLabel(`Mudar Título`)
                                .setEmoji("<:prancheta:1243267310576341042>"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_desc`)
                                .setLabel(`Mudar Descrição`)
                                .setEmoji("<:copy7:1225478184330596575>"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_select`)
                                .setLabel(`Configurar Select`)
                                .setEmoji("<:gerenciar:1239447347055034421>"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${option}_config_outrasconfig`)
                                .setLabel(`Outras Configurações`)
                                .setEmoji("<:1166960895201656852:1239447582464282674>"),
                            new ButtonBuilder()
                                .setStyle(3)
                                .setCustomId(`${option}_config_atualizar`)
                                .setLabel(`Atualizar Painel`)
                                .setEmoji("<a:load:1225477784743186472>"),
                        )
                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(1)
                                .setCustomId(`voltar_config`)
                                
                                .setEmoji("<:emoji_6:1239445960447361085>"),
                            new ButtonBuilder()
                                .setStyle(4)
                                .setCustomId(`${option}_config_del`)
                                .setEmoji("<:1166960963988230195:1239447625737048154>")
                        )
                    interaction.update({ embeds: [embed], components: [row, row2] })
                }
            }
            if (customId.endsWith('_config_atualizar')) {
                interaction.deferUpdate()
                if (dbTickets.get(`${tabom}.tipo`) === "button") {

                    const embed = new EmbedBuilder()
                        .setTitle(`${dbTickets.get(`${tabom}.title`)}`)
                        .setDescription(`${dbTickets.get(`${tabom}.desc`)}`)
                        .setColor(dbConfigs.get(`ticket.color`))

                    if (dbTickets.get(`${tabom}.banner`)) {
                        embed.setImage(dbTickets.get(`${tabom}.banner`))
                    }
                    if (dbTickets.get(`${tabom}.thumb`)) {
                        embed.setThumbnail(dbTickets.get(`${tabom}.thumb`))
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


                    const channel = interaction.guild.channels.cache.get(dbTickets.get(`${tabom}.idcanal`))
                    if (dbTickets.get(`${tabom}.modomsg`) === "ON") {
                        let options = {
                            embeds: [],
                            content: dbTickets.get(`${tabom}.desc`),
                            components: [row],
                            files: []
                        }
                        if (dbTickets.get(`${tabom}.banner`)) {
                            options.files = [dbTickets.get(`${tabom}.banner`)]
                        }
                        channel.messages.fetch(dbTickets.get(`${tabom}.idmsg`))
                            .then((message) => {
                                message.delete()
                                channel.send(options).then((msg) => {
                                    dbTickets.set(`${tabom}.idmsg`, msg.id)
                                    interaction.channel.send(`${dbEmojis.get(`6`)} | Atualizado!!`).then((editedMessage) => {
                                        setTimeout(() => {
                                            editedMessage.delete().catch(error => { });
                                        }, 5000);
                                    })
                                })
                            })
                            .catch(() => {
                                interaction.channel.send(`${dbEmojis.get(`13`)} | Não foi possível atualizar a mensagem.`).then((editedMessage) => {
                                    setTimeout(() => {
                                        editedMessage.delete().catch(error => { });
                                    }, 5000);
                                });
                            })
                    } else {
                        channel.messages.fetch(dbTickets.get(`${tabom}.idmsg`))
                            .then((message) => {
                                message.delete()
                                channel.send({ embeds: [embed], components: [row], files: [], content: `` }).then((msg) => {
                                    dbTickets.set(`${tabom}.idmsg`, msg.id)
                                    interaction.channel.send(`${dbEmojis.get(`6`)} | Atualizado!!`).then((editedMessage) => {
                                        setTimeout(() => {
                                            editedMessage.delete().catch(error => { });
                                        }, 5000);
                                    })
                                })
                            })
                            .catch(() => {
                                interaction.channel.send(`${dbEmojis.get(`13`)} | Não foi possível atualizar a mensagem.`).then((editedMessage) => {
                                    setTimeout(() => {
                                        editedMessage.delete().catch(error => { });
                                    }, 5000);
                                });
                            })
                    }
                } else if (dbTickets.get(`${tabom}.tipo`) === "select") {
                    const paineis = dbTickets.get(`${tabom}.select`);

                    if (!paineis || Object.keys(paineis).length === 0) {
                        interaction.reply({ flags: MessageFlags.Ephemeral, content: `${dbEmojis.get(`13`)} | Nenhum painel foi criado ainda!` })
                        return;
                    }
                    const embed = new EmbedBuilder()
                        .setTitle(`${dbTickets.get(`${tabom}.title`)}`)
                        .setDescription(`${dbTickets.get(`${tabom}.desc`)}`)
                        .setColor(dbConfigs.get(`ticket.color`))

                    if (dbTickets.get(`${tabom}.banner`)) {
                        embed.setImage(dbTickets.get(`${tabom}.banner`))
                    }
                    if (dbTickets.get(`${tabom}.thumb`)) {
                        embed.setThumbnail(dbTickets.get(`${tabom}.thumb`))
                    }

                    const actionrowselect = new StringSelectMenuBuilder()
                        .setCustomId('select_ticket')
                        .setPlaceholder(dbTickets.get(`${tabom}.placeholder`))




                    paineis.map((entry, index) => {
                        actionrowselect.addOptions(
                            {
                                label: `${entry.text}`,
                                description: `${entry.desc}`,
                                value: `${tabom}_${entry.id}`,
                                emoji: entry.emoji
                            }
                        )
                    })

                    const row = new ActionRowBuilder()
                        .addComponents(actionrowselect)
                    const channel = interaction.guild.channels.cache.get(dbTickets.get(`${tabom}.idcanal`))

                    if (dbTickets.get(`${tabom}.modomsg`) === "ON") {
                        let options = {
                            embeds: [],
                            content: dbTickets.get(`${tabom}.desc`),
                            components: [row],
                            files: []
                        }
                        if (dbTickets.get(`${tabom}.banner`)) {
                            options.files = [dbTickets.get(`${tabom}.banner`)]
                        }
                        channel.messages.fetch(dbTickets.get(`${tabom}.idmsg`))
                            .then((message) => {
                                message.delete()
                                channel.send(options).then((msg) => {
                                    dbTickets.set(`${tabom}.idmsg`, msg.id)
                                    interaction.channel.send(`${dbEmojis.get(`6`)} | Atualizado!!`).then((editedMessage) => {
                                        setTimeout(() => {
                                            editedMessage.delete().catch(error => { });
                                        }, 5000);
                                    })
                                })
                            })
                            .catch(() => {
                                interaction.channel.send(`${dbEmojis.get(`13`)} | Não foi possível atualizar a mensagem.`).then((editedMessage) => {
                                    setTimeout(() => {
                                        editedMessage.delete().catch(error => { });
                                    }, 5000);
                                });
                            })
                    } else {
                        channel.messages.fetch(dbTickets.get(`${tabom}.idmsg`))
                            .then((message) => {
                                message.delete()
                                channel.send({ embeds: [embed], components: [row], files: [], content: `` }).then((msg) => {
                                    dbTickets.set(`${tabom}.idmsg`, msg.id)
                                    interaction.channel.send(`${dbEmojis.get(`6`)} | Atualizado!!`).then((editedMessage) => {
                                        setTimeout(() => {
                                            editedMessage.delete().catch(error => { });
                                        }, 5000);
                                    })
                                })
                            })
                            .catch(() => {
                                interaction.channel.send(`${dbEmojis.get(`13`)} | Não foi possível atualizar a mensagem.`).then((editedMessage) => {
                                    setTimeout(() => {
                                        editedMessage.delete().catch(error => { });
                                    }, 5000);
                                });
                            })
                    }
                }
            }
            if (customId.endsWith('_config_title')) {
                interaction.deferUpdate();
                interaction.channel.send(`${dbEmojis.get(`16`)} | Qual o novo título?`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        message.delete()
                        dbTickets.set(`${tabom}.title`, `${message.content}`)
                        msg12.edit(`${dbEmojis.get(`6`)} | Alterado!`).then((editedMessage) => {
                            setTimeout(() => {
                                editedMessage.delete().catch(error => { });
                            }, 5000);
                        });

                        if (dbTickets.get(`${option}.tipo`) === "button") {
                            const embed = new EmbedBuilder()
                                .setAuthor({ name: `Configurando Painel `, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                .setDescription([
                                    `${dbEmojis.get(`2`)} Selecione função que queira mudar com os botões logo abaixo.`,
                                    `\u200b`,
                                    `**Descrição do Painel:**`,
                                    `${dbTickets.get(`${option}.desc`)}`
                                ].join('\n'))
                                .addFields(
                                    {
                                        name: `Nome do Painel:`,
                                        value: `\`${option}\``,
                                        inline: true
                                    },
                                    {
                                        name: `Tipo do Painel:`,
                                        value: `\`${dbTickets.get(`${option}.tipo`)}\``,
                                        inline: true
                                    },
                                    {
                                        name: `Categoria:`,
                                        value: `${interaction.guild.channels.cache.get(dbTickets.get(`${option}.categoria`)) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                                        inline: true
                                    },
                                    { name: ` `, value: ` `, inline: false },
                                    {
                                        name: `Título do Painel:`,
                                        value: `${dbTickets.get(`${option}.title`)}`,
                                        inline: false
                                    }
                                )
                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_title`)
                                        .setLabel(`Mudar Título`)
                                        .setEmoji("<:prancheta:1243267310576341042>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_desc`)
                                        .setLabel(`Mudar Descrição`)
                                        .setEmoji("<:copy7:1225478184330596575>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_button_voltar`)
                                        .setLabel(`Configurar Botão`)
                                        .setEmoji("<:gerenciar:1239447347055034421>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_outrasconfig`)
                                        .setLabel(`Outras Configurações`)
                                        .setEmoji("<:1166960895201656852:1239447582464282674>"),
                                    new ButtonBuilder()
                                        .setStyle(3)
                                        .setCustomId(`${option}_config_atualizar`)
                                        .setLabel(`Atualizar Painel`)
                                        .setEmoji("<a:load:1225477784743186472>"),
                                )
                            const row2 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(1)
                                        .setCustomId(`voltar_config`)
                                        
                                        .setEmoji("<:emoji_6:1239445960447361085>"),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`${option}_config_del`)
                                        .setEmoji("<:1166960963988230195:1239447625737048154>")
                                )
                            interaction.message.edit({ embeds: [embed], components: [row, row2] })
                        } else if (dbTickets.get(`${option}.tipo`) === "select") {
                            const embed = new EmbedBuilder()
                                .setAuthor({ name: `Configurando Painel`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                .setDescription([
                                    `${dbEmojis.get(`2`)} Selecione função que queira mudar com os botões logo abaixo.`,
                                    `\u200b`,
                                    `**Descrição do Painel:**`,
                                    `${dbTickets.get(`${option}.desc`)}`
                                ].join('\n'))
                                .addFields(
                                    {
                                        name: `Nome do Painel:`,
                                        value: `\`${option}\``,
                                        inline: true
                                    },
                                    {
                                        name: `Tipo do Painel:`,
                                        value: `\`${dbTickets.get(`${option}.tipo`)}\``,
                                        inline: true
                                    },
                                    {
                                        name: `Título do Painel:`,
                                        value: `${dbTickets.get(`${option}.title`)}`,
                                        inline: false
                                    }
                                )

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_title`)
                                        .setLabel(`Mudar Título`)
                                        .setEmoji("<:prancheta:1243267310576341042>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_desc`)
                                        .setLabel(`Mudar Descrição`)
                                        .setEmoji("<:copy7:1225478184330596575>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_select`)
                                        .setLabel(`Configurar Select`)
                                        .setEmoji("<:gerenciar:1239447347055034421>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_outrasconfig`)
                                        .setLabel(`Outras Configurações`)
                                        .setEmoji("<:1166960895201656852:1239447582464282674>"),
                                    new ButtonBuilder()
                                        .setStyle(3)
                                        .setCustomId(`${option}_config_atualizar`)
                                        .setLabel(`Atualizar Painel`)
                                        .setEmoji("<a:load:1225477784743186472>"),
                                )
                            const row2 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(1)
                                        .setCustomId(`voltar_config`)
                                        
                                        .setEmoji("<:emoji_6:1239445960447361085>"),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`${option}_config_del`)
                                        .setEmoji("<:1166960963988230195:1239447625737048154>")
                                )
                            interaction.message.edit({ embeds: [embed], components: [row, row2] })
                        }
                    })
                })
            }
            if (customId.endsWith('_config_desc')) {
                interaction.deferUpdate();
                interaction.channel.send(`${dbEmojis.get(`16`)} | Qual a nova descrição?`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        message.delete()
                        dbTickets.set(`${tabom}.desc`, `${message.content}`)
                        msg12.edit(`${dbEmojis.get(`6`)} | Alterado!`).then((editedMessage) => {
                            setTimeout(() => {
                                editedMessage.delete().catch(error => { });
                            }, 5000);
                        });

                        if (dbTickets.get(`${option}.tipo`) === "button") {
                            const embed = new EmbedBuilder()
                                .setAuthor({ name: `Configurando Painel `, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                .setDescription([
                                    `${dbEmojis.get(`2`)} Selecione função que queira mudar com os botões logo abaixo.`,
                                    `\u200b`,
                                    `**Descrição do Painel:**`,
                                    `${dbTickets.get(`${option}.desc`)}`
                                ].join('\n'))
                                .addFields(
                                    {
                                        name: `Nome do Painel:`,
                                        value: `\`${option}\``,
                                        inline: true
                                    },
                                    {
                                        name: `Tipo do Painel:`,
                                        value: `\`${dbTickets.get(`${option}.tipo`)}\``,
                                        inline: true
                                    },
                                    {
                                        name: `Categoria:`,
                                        value: `${interaction.guild.channels.cache.get(dbTickets.get(`${option}.categoria`)) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                                        inline: true
                                    },
                                    { name: ` `, value: ` `, inline: false },
                                    {
                                        name: `Título do Painel:`,
                                        value: `${dbTickets.get(`${option}.title`)}`,
                                        inline: false
                                    }
                                )
                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_title`)
                                        .setLabel(`Mudar Título`)
                                        .setEmoji("<:prancheta:1243267310576341042>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_desc`)
                                        .setLabel(`Mudar Descrição`)
                                        .setEmoji("<:copy7:1225478184330596575>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_button_voltar`)
                                        .setLabel(`Configurar Botão`)
                                        .setEmoji("<:gerenciar:1239447347055034421>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_outrasconfig`)
                                        .setLabel(`Outras Configurações`)
                                        .setEmoji("<:1166960895201656852:1239447582464282674>"),
                                    new ButtonBuilder()
                                        .setStyle(3)
                                        .setCustomId(`${option}_config_atualizar`)
                                        .setLabel(`Atualizar Painel`)
                                        .setEmoji("<a:load:1225477784743186472>"),
                                )
                            const row2 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(1)
                                        .setCustomId(`voltar_config`)
                                        
                                        .setEmoji("<:emoji_6:1239445960447361085>"),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`${option}_config_del`)
                                        .setEmoji("<:1166960963988230195:1239447625737048154>")
                                )
                            interaction.message.edit({ embeds: [embed], components: [row, row2] })
                        } else if (dbTickets.get(`${option}.tipo`) === "select") {
                            const embed = new EmbedBuilder()
                                .setAuthor({ name: `Configurando Painel`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                .setDescription([
                                    `${dbEmojis.get(`2`)} Selecione função que queira mudar com os botões logo abaixo.`,
                                    `\u200b`,
                                    `**Descrição do Painel:**`,
                                    `${dbTickets.get(`${option}.desc`)}`
                                ].join('\n'))
                                .addFields(
                                    {
                                        name: `Nome do Painel:`,
                                        value: `\`${option}\``,
                                        inline: true
                                    },
                                    {
                                        name: `Tipo do Painel:`,
                                        value: `\`${dbTickets.get(`${option}.tipo`)}\``,
                                        inline: true
                                    },
                                    {
                                        name: `Título do Painel:`,
                                        value: `${dbTickets.get(`${option}.title`)}`,
                                        inline: false
                                    }
                                )

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_title`)
                                        .setLabel(`Mudar Título`)
                                        .setEmoji("<:prancheta:1243267310576341042>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_desc`)
                                        .setLabel(`Mudar Descrição`)
                                        .setEmoji("<:copy7:1225478184330596575>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_select`)
                                        .setLabel(`Configurar Select`)
                                        .setEmoji("<:gerenciar:1239447347055034421>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${option}_config_outrasconfig`)
                                        .setLabel(`Outras Configurações`)
                                        .setEmoji("<:1166960895201656852:1239447582464282674>"),
                                    new ButtonBuilder()
                                        .setStyle(3)
                                        .setCustomId(`${option}_config_atualizar`)
                                        .setLabel(`Atualizar Painel`)
                                        .setEmoji("<a:load:1225477784743186472>"),
                                )
                            const row2 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(1)
                                        .setCustomId(`voltar_config`)
                                        
                                        .setEmoji("<:emoji_6:1239445960447361085>"),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`${option}_config_del`)
                                        .setEmoji("<:1166960963988230195:1239447625737048154>")
                                )
                            interaction.message.edit({ embeds: [embed], components: [row, row2] })
                        }
                    })
                })
            }
        }

        if (interaction.isModalSubmit()) {
            const customId = interaction.customId;
            const tabom = customId.split("_")[0]
            const tabom2 = customId.split("_")[1]

            if (customId.endsWith("_configbutton_msgauto_alt_modal")) {
                const buttons = dbTickets.get(`${tabom}.buttons`)
                buttons.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const text = interaction.fields.getTextInputValue("text_modal");

                        const id = entry.id - 1
                        buttons[id].msg.mensagem = text

                        dbTickets.set(`${tabom}.buttons`, buttons)

                        interaction.reply({ content: `${dbEmojis.get(`6`)} | Alterado!`, flags: MessageFlags.Ephemeral })
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Mensagem Automática`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure a mensagem automática que será disparada após o usuário abrir o ticket.`)
                            .addFields(
                                {
                                    name: `Mensagem:`,
                                    value: `${entry.msg.mensagem || "`Mensagem Padrão`"}`,
                                    inline: true
                                },
                                {
                                    name: `Sistema:`,
                                    value: `${entry.msg.sistema === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`,
                                    inline: true
                                }
                            )
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.msg.sistema === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto_onoff`)
                                    .setLabel(entry.msg.sistema === "ON" ? "Sistema (Ligado)" : "Sistema (Desligado)")
                                    .setEmoji(entry.msg.sistema === "ON" ? "<:on_mt:1232722645238288506>" : "<:off:1243274635748048937>"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msgauto_alt`)
                                    .setLabel("Mensagem ")
                                    .setEmoji("<:prancheta:1243267310576341042>"),
                                new ButtonBuilder()
                                    .setStyle(4)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_msg_reset`)
                                    .setLabel("Resetar")
                                    .setEmoji("<a:load:1225477784743186472>"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                    
                                    .setEmoji("<:emoji_6:1239445960447361085>")
                            )
                        interaction.message.edit({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configsele_msgauto_alt_modal")) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const text = interaction.fields.getTextInputValue("text_modal");

                        const id = entry.id - 1
                        select[id].msg.mensagem = text

                        dbTickets.set(`${tabom}.select`, select)

                        interaction.reply({ content: `${dbEmojis.get(`6`)} | Alterado!`, flags: MessageFlags.Ephemeral })
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Mensagem Automática`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure a mensagem automática que será disparada após o usuário abrir o ticket.`)
                            .addFields(
                                {
                                    name: `Mensagem:`,
                                    value: `${entry.msg.mensagem || "`Mensagem Padrão`"}`,
                                    inline: true
                                },
                                {
                                    name: `Sistema:`,
                                    value: `${entry.msg.sistema === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`,
                                    inline: true
                                }
                            )
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.msg.sistema === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msgauto_onoff`)
                                    .setLabel(entry.msg.sistema === "ON" ? "Sistema (Ligado)" : "Sistema (Desligado)")
                                    .setEmoji(entry.msg.sistema === "ON" ? "<:on_mt:1232722645238288506>" : "<:off:1243274635748048937>"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msgauto_alt`)
                                    .setLabel("Mensagem ")
                                    .setEmoji("<:prancheta:1243267310576341042>"),
                                new ButtonBuilder()
                                    .setStyle(4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msg_reset`)
                                    .setLabel("Resetar")
                                    .setEmoji("<a:load:1225477784743186472>"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    
                                    .setEmoji("<:emoji_6:1239445960447361085>")
                            )
                        interaction.message.edit({ embeds: [embed], components: [row] })
                    }
                })
            }
        }
        if (interaction.isChannelSelectMenu()) {
            const customId = interaction.customId;
            const tabom = customId.split("_")[0]
            const tabom2 = customId.split("_")[1]
            if (customId.endsWith("_button_category")) {
                const cargos = interaction.values
                cargos.map((cargos) => {
                    const id = customId.split("_")[1]
                    let buttonss = dbTickets.get(`${tabom}.buttons`) || [];
                    let elementIndex = id - 1

                    // Se o elemento for encontrado, edita-o
                    if (elementIndex !== -1) {
                        // Edita o elemento conforme necessário
                        buttonss[elementIndex].categoria = cargos;
                    }
                    dbTickets.set(`${tabom}.buttons`, buttonss)
                    interaction.reply({ content: `${dbEmojis.get(`6`)} | Alterado com sucesso!`, flags: MessageFlags.Ephemeral })

                    const buttons = dbTickets.get(`${tabom}.buttons`)
                    let entry = buttons[id]
                    let style = "";
                    buttons.map(entry => {
                        if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                            let style = "";
                            if (entry.style === 1) {
                                style = "\`🔵 Azul - 1\`"
                            }
                            if (entry.style === 2) {
                                style = "\`⚫ Cinza - 2\`"
                            }
                            if (entry.style === 3) {
                                style = "\`🟢 Verde - 3\`"
                            }
                            if (entry.style === 4) {
                                style = "\`🔴 Vermelho - 4\`"
                            }
                            const categoria = interaction.guild.channels.cache.get(entry.categoria)
                            const embed = new EmbedBuilder()
                                .setAuthor({ name: `Configurando Botão (${tabom})`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                                .setDescription(`Selecione abaixo qual botão você deseja configurar!`)
                                .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                .addFields(
                                    {
                                        name: `Texto:`,
                                        value: `${entry.text}`,
                                        inline: true
                                    },
                                    {
                                        name: `Emoji:`,
                                        value: `${entry.emoji}`,
                                        inline: true
                                    },
                                    {
                                        name: `Cor:`,
                                        value: `${style}`,
                                        inline: true
                                    },
                                    {
                                        name: `Categoria:`,
                                        value: `${categoria || "\`Não Definido\`"}`,
                                        inline: true
                                    }
                                )

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${tabom}_${entry.id}_configbutton_text`)
                                        .setLabel(`Mudar Texto`)
                                        .setEmoji("<:prancheta:1243267310576341042>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${tabom}_${entry.id}_configbutton_emoji`)
                                        .setLabel(`Mudar Emoji`)
                                        .setEmoji("<:emoji_47:1240119456236048476>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${tabom}_${entry.id}_configbutton_cor`)
                                        .setLabel(`Mudar Cor`)
                                        .setEmoji(`<:emoji_46:1240119442722127872>`),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${tabom}_${entry.id}_configbutton_categoria`)
                                        .setLabel(`Mudar Categoria`)
                                        .setEmoji("<:emoji_4:1239445904826695750>"),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                        .setLabel(`Outras Opções`)
                                        .setEmoji("<:1166960895201656852:1239447582464282674>")
                                )
                            const row2 = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(1)
                                        .setCustomId(`${tabom}_config_button_voltar`)
                                        
                                        .setEmoji("<:emoji_6:1239445960447361085>")
                                )
                            interaction.message.edit({ embeds: [embed], components: [row, row2] })
                        }
                    })
                })
            }
            if (customId.endsWith("_configsele_category")) {
                const cargos = interaction.values
                cargos.map((cargos) => {
                    let selectArray = dbTickets.get(`${tabom}.select`) || [];
                    const entry = selectArray.find(item => item.id === Number(tabom2));

                    // Encontra o elemento que deseja editar (por exemplo, pelo ID)
                    const elementIndex = selectArray.findIndex(element => element.id === Number(tabom2));

                    // Se o elemento for encontrado, edita-o
                    if (elementIndex !== -1) {
                        // Edita o elemento conforme necessário
                        selectArray[elementIndex].categoria = cargos;
                    }

                    // Define o array atualizado na base de dados
                    dbTickets.set(`${tabom}.select`, selectArray);
                    interaction.channel.send(`${dbEmojis.get(`6`)} | Alterado!`).then((editedMessage) => {
                        setTimeout(() => {
                            editedMessage.delete().catch(error => { });
                        }, 5000);
                    });
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Configurando Select`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setDescription(`Configure o seu select selecionando as opções abaixo.`)
                        .setColor(dbConfigs.get(`ticket.color`) || "Default")
                        .addFields(
                            {
                                name: `Texto:`,
                                value: `${entry.text}`,
                                inline: true
                            },
                            {
                                name: `Descrição:`,
                                value: `${entry.desc}`,
                                inline: true
                            },
                            {
                                name: `Emoji:`,
                                value: `${entry.emoji}`,
                                inline: true
                            },
                            {
                                name: `Categoria:`,
                                value: `${interaction.guild.channels.cache.get(entry.categoria) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                                inline: true
                            },
                            {
                                name: `ID:`,
                                value: `${entry.id}`,
                                inline: true
                            },
                        )

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configsele_text`)
                                .setLabel(`Mudar Texto`)
                                .setEmoji("✏️"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configsele_desc`)
                                .setLabel(`Mudar Descrição`)
                                .setEmoji("📝"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configsele_emoji`)
                                .setLabel(`Mudar Emoji`)
                                .setEmoji("😀"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configsele_categoria`)
                                .setLabel(`Mudar Categoria`)
                                .setEmoji("🔧"),
                            new ButtonBuilder()
                                .setStyle(1)
                                .setCustomId(`${tabom}_${entry.id}_voltar_mapselect`)
                                
                                .setEmoji("↩️"),
                        )
                    interaction.update({ embeds: [embed], components: [row] })
                })
            }
        }
        if (interaction.isStringSelectMenu() && interaction.customId === "select_config_buttons") {
            const option = interaction.values[0];
            const tabom = option.split("_")[0];

            const buttons = dbTickets.get(`${tabom}.buttons`)

            buttons.map(entry => {
                if (option.endsWith(`_${entry.id}`)) {
                    let style = "";
                    if (entry.style === 1) {
                        style = "\`🔵 Azul - 1\`"
                    }
                    if (entry.style === 2) {
                        style = "\`⚫ Cinza - 2\`"
                    }
                    if (entry.style === 3) {
                        style = "\`🟢 Verde - 3\`"
                    }
                    if (entry.style === 4) {
                        style = "\`🔴 Vermelho - 4\`"
                    }
                    const categoria = interaction.guild.channels.cache.get(entry.categoria)
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Configurando Botão (${tabom})`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                        .setDescription(`Selecione abaixo qual botão você deseja configurar!`)
                        .setColor(dbConfigs.get(`ticket.color`) || "Default")
                        .addFields(
                            {
                                name: `Texto:`,
                                value: `${entry.text}`,
                                inline: true
                            },
                            {
                                name: `Emoji:`,
                                value: `${entry.emoji}`,
                                inline: true
                            },
                            {
                                name: `Cor:`,
                                value: `${style}`,
                                inline: true
                            },
                            {
                                name: `Categoria:`,
                                value: `${categoria || "\`Não Definido\`"}`,
                                inline: true
                            }
                        )

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configbutton_text`)
                                .setLabel(`Mudar Texto`)
                                .setEmoji("✏️"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configbutton_emoji`)
                                .setLabel(`Mudar Emoji`)
                                .setEmoji("😀"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configbutton_cor`)
                                .setLabel(`Mudar Cor`)
                                .setEmoji(`🎨`),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configbutton_categoria`)
                                .setLabel(`Mudar Categoria`)
                                .setEmoji("🔧"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configbutton_outrasopc`)
                                .setLabel(`Outras Opções`)
                                .setEmoji("⚙️")
                        )
                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(1)
                                .setCustomId(`${tabom}_config_button_voltar`)
                                
                                .setEmoji("↩️")
                        )
                    interaction.update({ embeds: [embed], components: [row, row2] })
                }
            })

        }
        if (interaction.isStringSelectMenu() && interaction.customId === "select_config_options") {
            const option = interaction.values[0];
            const tabom = option.split("_")[0];
            const paineis = dbTickets.get(`${tabom}.select`);

            paineis.map((entry, index) => {
                if (option.endsWith(`_${entry.id}`)) {

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `Configurando Select`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setDescription(`Configure o seu select selecionando as opções abaixo.`)
                        .setColor(dbConfigs.get(`ticket.color`) || "Default")
                        .addFields(
                            {
                                name: `Texto:`,
                                value: `${entry.text}`,
                                inline: true
                            },
                            {
                                name: `Descrição:`,
                                value: `${entry.desc}`,
                                inline: true
                            },
                            {
                                name: `Emoji:`,
                                value: `${entry.emoji}`,
                                inline: true
                            },
                            {
                                name: `Categoria:`,
                                value: `${interaction.guild.channels.cache.get(entry.categoria) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                                inline: true
                            },
                            {
                                name: `ID:`,
                                value: `${entry.id}`,
                                inline: true
                            },
                        )

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configsele_text`)
                                .setLabel(`Mudar Texto`)
                                .setEmoji("✏️"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configsele_desc`)
                                .setLabel(`Mudar Descrição`)
                                .setEmoji("📝"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configsele_emoji`)
                                .setLabel(`Mudar Emoji`)
                                .setEmoji("😀"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configsele_categoria`)
                                .setLabel(`Mudar Categoria`)
                                .setEmoji("🔧"),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                .setLabel(`Outras Opções`)
                                .setEmoji("⚙️")
                        )
                    const row2 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(1)
                                .setCustomId(`${tabom}_${entry.id}_voltar_mapselect`)
                                
                                .setEmoji("↩️"),
                        )
                    interaction.update({ embeds: [embed], components: [row, row2] })

                }
            })

        }

        if (interaction.isButton()) {
            const customId = interaction.customId;
            const tabom = customId.split("_")[0];
            const tabom2 = customId.split("_")[1];

            if (customId.endsWith('_voltar_mapselect')) {
                const embed = new EmbedBuilder()
                    .setTitle(`Configurando Select.`)
                    .setDescription(`Selecione a opção de criação do ticket que deseja configurar`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")

                const actionrowselect = new StringSelectMenuBuilder()
                    .setCustomId('select_config_options')
                    .setPlaceholder("Selecione uma opção para configurar")

                const paineis = dbTickets.get(`${tabom}.select`);

                paineis.map((entry, index) => {
                    actionrowselect.addOptions(
                        {
                            label: `Texto: ${entry.text}`,
                            description: `ID: ${entry.id}`,
                            value: `${tabom}_${entry.id}`,
                            emoji: entry.emoji
                        }
                    )
                })

                const row = new ActionRowBuilder()
                    .addComponents(actionrowselect)

                const rowb = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(3)
                            .setCustomId(`${tabom}_add_option_select`)
                            .setLabel(`Add Nova Opção`)
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setStyle(4)
                            .setCustomId(`${tabom}_sub_option_select`)
                            .setLabel(`Remover Opção`)
                            .setEmoji("➖"),
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_config_voltar`)
                            
                            .setEmoji("↩️")
                    )
                interaction.update({ embeds: [embed], components: [row, rowb] })
            }

            if (customId.endsWith('_configsele_text')) {
                interaction.deferUpdate()
                interaction.channel.send(`${dbEmojis.get(`16`)} | Qual o novo texto?`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        message.delete()
                        // Obtém o array da base de dados
                        let selectArray = dbTickets.get(`${tabom}.select`) || [];

                        // Encontra o elemento que deseja editar (por exemplo, pelo ID)
                        const elementIndex = selectArray.findIndex(element => element.id === Number(tabom2));

                        // Se o elemento for encontrado, edita-o
                        if (elementIndex !== -1) {
                            // Edita o elemento conforme necessário
                            selectArray[elementIndex].text = message.content;
                        }

                        // Define o array atualizado na base de dados
                        dbTickets.set(`${tabom}.select`, selectArray);
                        msg12.edit(`${dbEmojis.get(`6`)} | Alterado!`).then((editedMessage) => {
                            setTimeout(() => {
                                editedMessage.delete().catch(error => { });
                            }, 5000);
                        });
                        const entry = selectArray.find(item => item.id === Number(tabom2));

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Select`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setDescription(`Configure o seu select selecionando as opções abaixo.`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Texto:`,
                                    value: `${entry.text}`,
                                    inline: true
                                },
                                {
                                    name: `Descrição:`,
                                    value: `${entry.desc}`,
                                    inline: true
                                },
                                {
                                    name: `Emoji:`,
                                    value: `${entry.emoji}`,
                                    inline: true
                                },
                                {
                                    name: `Categoria:`,
                                    value: `${interaction.guild.channels.cache.get(entry.categoria) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                                    inline: true
                                },
                                {
                                    name: `ID:`,
                                    value: `${entry.id}`,
                                    inline: true
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_text`)
                                    .setLabel(`Mudar Texto`)
                                    .setEmoji("✏️"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_desc`)
                                    .setLabel(`Mudar Descrição`)
                                    .setEmoji("📝"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_emoji`)
                                    .setLabel(`Mudar Emoji`)
                                    .setEmoji("😀"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_categoria`)
                                    .setLabel(`Mudar Categoria`)
                                    .setEmoji("🔧"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    .setLabel(`Outras Opções`)
                                    .setEmoji("⚙️")
                            )
                        const row2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_voltar_mapselect`)
                                    
                                    .setEmoji("↩️"),
                            )
                        interaction.message.edit({ embeds: [embed], components: [row, row2] })
                    })
                })
            }
            if (customId.endsWith('_configsele_desc')) {
                interaction.deferUpdate()
                interaction.channel.send(`${dbEmojis.get(`16`)} | Qual a nova descrição?`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        message.delete()
                        // Obtém o array da base de dados
                        let selectArray = dbTickets.get(`${tabom}.select`) || [];

                        // Encontra o elemento que deseja editar (por exemplo, pelo ID)
                        const elementIndex = selectArray.findIndex(element => element.id === Number(tabom2));

                        // Se o elemento for encontrado, edita-o
                        if (elementIndex !== -1) {
                            // Edita o elemento conforme necessário
                            selectArray[elementIndex].desc = message.content;
                        }

                        // Define o array atualizado na base de dados
                        dbTickets.set(`${tabom}.select`, selectArray);
                        msg12.edit(`${dbEmojis.get(`6`)} | Alterado!`).then((editedMessage) => {
                            setTimeout(() => {
                                editedMessage.delete().catch(error => { })
                            }, 5000);
                        });
                        const entry = selectArray.find(item => item.id === Number(tabom2));

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Select`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setDescription(`Configure o seu select selecionando as opções abaixo.`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Texto:`,
                                    value: `${entry.text}`,
                                    inline: true
                                },
                                {
                                    name: `Descrição:`,
                                    value: `${entry.desc}`,
                                    inline: true
                                },
                                {
                                    name: `Emoji:`,
                                    value: `${entry.emoji}`,
                                    inline: true
                                },
                                {
                                    name: `Categoria:`,
                                    value: `${interaction.guild.channels.cache.get(entry.categoria) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                                    inline: true
                                },
                                {
                                    name: `ID:`,
                                    value: `${entry.id}`,
                                    inline: true
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_text`)
                                    .setLabel(`Mudar Texto`)
                                    .setEmoji("✏️"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_desc`)
                                    .setLabel(`Mudar Descrição`)
                                    .setEmoji("📝"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_emoji`)
                                    .setLabel(`Mudar Emoji`)
                                    .setEmoji("😀"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_categoria`)
                                    .setLabel(`Mudar Categoria`)
                                    .setEmoji("🔧"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    .setLabel(`Outras Opções`)
                                    .setEmoji("⚙️")
                            )
                        const row2 = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_voltar_mapselect`)
                                    
                                    .setEmoji("↩️"),
                            )
                        interaction.message.edit({ embeds: [embed], components: [row, row2] })
                    })
                })
            }
            if (customId.endsWith("_configsele_voltarr")) {
                let selectArray = dbTickets.get(`${tabom}.select`) || [];
                const entry = selectArray.find(item => item.id === Number(tabom2));

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Configurando Select`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`Configure o seu select selecionando as opções abaixo.`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")
                    .addFields(
                        {
                            name: `Texto:`,
                            value: `${entry.text}`,
                            inline: true
                        },
                        {
                            name: `Descrição:`,
                            value: `${entry.desc}`,
                            inline: true
                        },
                        {
                            name: `Emoji:`,
                            value: `${entry.emoji}`,
                            inline: true
                        },
                        {
                            name: `Categoria:`,
                            value: `${interaction.guild.channels.cache.get(entry.categoria) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                            inline: true
                        },
                        {
                            name: `ID:`,
                            value: `${entry.id}`,
                            inline: true
                        },
                    )

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${tabom}_${entry.id}_configsele_text`)
                            .setLabel(`Mudar Texto`)
                            .setEmoji("✏️"),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${tabom}_${entry.id}_configsele_desc`)
                            .setLabel(`Mudar Descrição`)
                            .setEmoji("📝"),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${tabom}_${entry.id}_configsele_emoji`)
                            .setLabel(`Mudar Emoji`)
                            .setEmoji("😀"),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${tabom}_${entry.id}_configsele_categoria`)
                            .setLabel(`Mudar Categoria`)
                            .setEmoji("🔧"),
                        new ButtonBuilder()
                            .setStyle(2)
                            .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                            .setLabel(`Outras Opções`)
                            .setEmoji("⚙️")
                    )
                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_${entry.id}_voltar_mapselect`)
                            
                            .setEmoji("↩️"),
                    )
                interaction.update({ embeds: [embed], components: [row, row2] })
            }
            if (customId.endsWith('_configsele_emoji')) {
                interaction.deferUpdate()
                interaction.channel.send(`${dbEmojis.get(`16`)} | Qual o novo emoji?`).then(msg12 => {
                    const filter = m => m.author.id === interaction.user.id;
                    const collector = msg12.channel.createMessageCollector({ filter, max: 1 });
                    collector.on("collect", message => {
                        message.delete()
                        const newt = message.content
                        let selectArray = dbTickets.get(`${tabom}.select`) || [];
                        selectArray.map(entry => {
                            if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                                const id = entry.id - 1

                                // Edita o elemento conforme necessário
                                const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;


                                if (newt.startsWith('<')) {
                                    selectArray[id].emoji = message.content;
                                    msg12.edit(`${dbEmojis.get(`6`)} | Alterado com sucesso!`).then(msg => {
                                        setTimeout(() => {
                                            msg.delete().catch(error => { })
                                        }, 5000);
                                    })
                                } else if (emojiRegex.test(newt)) {
                                    selectArray[id].emoji = message.content;
                                    msg12.edit(`${dbEmojis.get(`6`)} | Alterado com sucesso!`).then(msg => {
                                        setTimeout(() => {
                                            msg.delete().catch(error => { })
                                        }, 5000);
                                    })
                                } else {
                                    msg12.edit(`${dbEmojis.get(`13`)} | Emoji inválido!`).then(msg => {
                                        setTimeout(() => {
                                            msg.delete().catch(error => { })
                                        }, 5000);
                                    })
                                }
                                dbTickets.set(`${tabom}.select`, selectArray);
                                const embed = new EmbedBuilder()
                                    .setAuthor({ name: `Configurando Select`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                                    .setDescription(`Configure o seu select selecionando as opções abaixo.`)
                                    .setColor(dbConfigs.get(`ticket.color`) || "Default")
                                    .addFields(
                                        {
                                            name: `Texto:`,
                                            value: `${entry.text}`,
                                            inline: true
                                        },
                                        {
                                            name: `Descrição:`,
                                            value: `${entry.desc}`,
                                            inline: true
                                        },
                                        {
                                            name: `Emoji:`,
                                            value: `${selectArray[id].emoji}`,
                                            inline: true
                                        },
                                        {
                                            name: `Categoria:`,
                                            value: `${interaction.guild.channels.cache.get(entry.categoria) || interaction.guild.channels.cache.get(dbConfigs.get(`ticket.ticket.categoria`)) || "\`Não Definido\`"}`,
                                            inline: true
                                        },
                                        {
                                            name: `ID:`,
                                            value: `${entry.id}`,
                                            inline: true
                                        },
                                    )

                                const row = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configsele_text`)
                                            .setLabel(`Mudar Texto`)
                                            .setEmoji("✏️"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configsele_desc`)
                                            .setLabel(`Mudar Descrição`)
                                            .setEmoji("📝"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configsele_emoji`)
                                            .setLabel(`Mudar Emoji`)
                                            .setEmoji("😀"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configsele_categoria`)
                                            .setLabel(`Mudar Categoria`)
                                            .setEmoji("🔧"),
                                        new ButtonBuilder()
                                            .setStyle(2)
                                            .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                            .setLabel(`Outras Opções`)
                                            .setEmoji("⚙️")
                                    )
                                const row2 = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(1)
                                            .setCustomId(`${tabom}_${entry.id}_voltar_mapselect`)
                                            
                                            .setEmoji("↩️"),
                                    )
                                interaction.message.edit({ embeds: [embed], components: [row, row2] })
                            }
                        })
                    })
                })
            }
            if (customId.endsWith("_configsele_outrasopc")) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Outras Configurações`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Selecione abaixo as outras opções!`)
                            .addFields()
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modais`)
                                    .setLabel("Configurar Modais")
                                    .setEmoji("🔧"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msgauto`)
                                    .setLabel("Mensagem Automática")
                                    .setEmoji("✏️"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_voltarr`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configsele_modais")) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const assunto = entry.assunto === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const descticket = entry.desc === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const motivofinaliza = entry.finaliza === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Modais`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure os sistemas de modais que serão perguntados nas criações dos Tickets!`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Assunto Ticket:`,
                                    value: `${assunto}`,
                                    inline: false
                                },
                                {
                                    name: `Descrição do Ticket:`,
                                    value: `${descticket}`,
                                    inline: false
                                },
                                {
                                    name: `Motivo Finalização:`,
                                    value: `${motivofinaliza}`,
                                    inline: false
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.assunto === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modalassunto`)
                                    .setLabel(`Assunto do Ticket`)
                                    .setEmoji(entry.assunto === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.desc === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modaldesc`)
                                    .setLabel(`Descrição do ticket`)
                                    .setEmoji(entry.desc === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.finaliza === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modalfinalization`)
                                    .setLabel(`Finalização do ticket`)
                                    .setEmoji(entry.finaliza === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    
                                    .setEmoji("🛠️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configsele_modalfinalization")) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        if (entry.finaliza === "ON") {
                            select[id].finaliza = "OFF"
                            dbTickets.set(`${tabom}.select`, select)
                        } else {
                            select[id].finaliza = "ON"
                            dbTickets.set(`${tabom}.select`, select)
                        }
                        const assunto = entry.assunto === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const descticket = entry.desc === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const motivofinaliza = entry.finaliza === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Modais`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure os sistemas de modais que serão perguntados nas criações dos Tickets!`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Assunto Ticket:`,
                                    value: `${assunto}`,
                                    inline: false
                                },
                                {
                                    name: `Descrição do Ticket:`,
                                    value: `${descticket}`,
                                    inline: false
                                },
                                {
                                    name: `Motivo Finalização:`,
                                    value: `${motivofinaliza}`,
                                    inline: false
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.assunto === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modalassunto`)
                                    .setLabel(`Assunto do Ticket`)
                                    .setEmoji(entry.assunto === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.desc === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modaldesc`)
                                    .setLabel(`Descrição do ticket`)
                                    .setEmoji(entry.desc === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.finaliza === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modalfinalization`)
                                    .setLabel(`Finalização do ticket`)
                                    .setEmoji(entry.finaliza === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    
                                    .setEmoji("🛠️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configsele_modaldesc")) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        if (entry.desc === "ON") {
                            select[id].desc = "OFF"
                            dbTickets.set(`${tabom}.select`, select)
                        } else {
                            select[id].desc = "ON"
                            dbTickets.set(`${tabom}.select`, select)
                        }
                        const assunto = entry.assunto === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const descticket = entry.desc === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const motivofinaliza = entry.finaliza === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Modais`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure os sistemas de modais que serão perguntados nas criações dos Tickets!`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Assunto Ticket:`,
                                    value: `${assunto}`,
                                    inline: false
                                },
                                {
                                    name: `Descrição do Ticket:`,
                                    value: `${descticket}`,
                                    inline: false
                                },
                                {
                                    name: `Motivo Finalização:`,
                                    value: `${motivofinaliza}`,
                                    inline: false
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.assunto === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modalassunto`)
                                    .setLabel(`Assunto do Ticket`)
                                    .setEmoji(entry.assunto === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.desc === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modaldesc`)
                                    .setLabel(`Descrição do ticket`)
                                    .setEmoji(entry.desc === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.finaliza === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modalfinalization`)
                                    .setLabel(`Finalização do ticket`)
                                    .setEmoji(entry.finaliza === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    
                                    .setEmoji("🛠️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configsele_modalassunto")) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        if (entry.assunto === "ON") {
                            select[id].assunto = "OFF"
                            dbTickets.set(`${tabom}.select`, select)
                        } else {
                            select[id].assunto = "ON"
                            dbTickets.set(`${tabom}.select`, select)
                        }
                        const assunto = entry.assunto === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const descticket = entry.desc === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"
                        const motivofinaliza = entry.finaliza === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"

                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Configurando Modais`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure os sistemas de modais que serão perguntados nas criações dos Tickets!`)
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")
                            .addFields(
                                {
                                    name: `Assunto Ticket:`,
                                    value: `${assunto}`,
                                    inline: false
                                },
                                {
                                    name: `Descrição do Ticket:`,
                                    value: `${descticket}`,
                                    inline: false
                                },
                                {
                                    name: `Motivo Finalização:`,
                                    value: `${motivofinaliza}`,
                                    inline: false
                                },
                            )

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.assunto === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modalassunto`)
                                    .setLabel(`Assunto do Ticket`)
                                    .setEmoji(entry.assunto === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.desc === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modaldesc`)
                                    .setLabel(`Descrição do ticket`)
                                    .setEmoji(entry.desc === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(entry.finaliza === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_modalfinalization`)
                                    .setLabel(`Finalização do ticket`)
                                    .setEmoji(entry.finaliza === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    
                                    .setEmoji("🛠️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configsele_msgauto")) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Mensagem Automática`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure a mensagem automática que será disparada após o usuário abrir o ticket.`)
                            .addFields(
                                {
                                    name: `Mensagem:`,
                                    value: `${entry.msg.mensagem || "`Mensagem Padrão`"}`,
                                    inline: true
                                },
                                {
                                    name: `Sistema:`,
                                    value: `${entry.msg.sistema === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`,
                                    inline: true
                                }
                            )
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.msg.sistema === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msgauto_onoff`)
                                    .setLabel(entry.msg.sistema === "ON" ? "Sistema (Ligado)" : "Sistema (Desligado)")
                                    .setEmoji(entry.msg.sistema === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msgauto_alt`)
                                    .setLabel("Mensagem ")
                                    .setEmoji("✏️"),
                                new ButtonBuilder()
                                    .setStyle(4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msg_reset`)
                                    .setLabel("Resetar")
                                    .setEmoji("⚠️"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configsele_msgauto_onoff")) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        if (entry.msg.sistema === "ON") {
                            select[id].msg.sistema = "OFF"
                        } else {
                            select[id].msg.sistema = "ON"
                        }
                        dbTickets.set(`${tabom}.select`, select)
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Mensagem Automática`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure a mensagem automática que será disparada após o usuário abrir o ticket.`)
                            .addFields(
                                {
                                    name: `Mensagem:`,
                                    value: `${entry.msg.mensagem || "`Mensagem Padrão`"}`,
                                    inline: true
                                },
                                {
                                    name: `Sistema:`,
                                    value: `${entry.msg.sistema === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`,
                                    inline: true
                                }
                            )
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.msg.sistema === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msgauto_onoff`)
                                    .setLabel(entry.msg.sistema === "ON" ? "Sistema (Ligado)" : "Sistema (Desligado)")
                                    .setEmoji(entry.msg.sistema === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msgauto_alt`)
                                    .setLabel("Mensagem ")
                                    .setEmoji("✏️"),
                                new ButtonBuilder()
                                    .setStyle(4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msg_reset`)
                                    .setLabel("Resetar")
                                    .setEmoji("⚠️"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith(`_configsele_msg_reset`)) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        let id = entry.id - 1
                        select[id].msg.mensagem = ""
                        select[id].msg.sistema = "ON"
                        dbTickets.set(`${tabom}.select`, select)
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: `Mensagem Automática`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                            .setDescription(`Configure a mensagem automática que será disparada após o usuário abrir o ticket.`)
                            .addFields(
                                {
                                    name: `Mensagem:`,
                                    value: `${entry.msg.mensagem || "`Mensagem Padrão`"}`,
                                    inline: true
                                },
                                {
                                    name: `Sistema:`,
                                    value: `${entry.msg.sistema === "ON" ? "`🟢 Ligado`" : "`🔴 Desligado`"}`,
                                    inline: true
                                }
                            )
                            .setColor(dbConfigs.get(`ticket.color`) || "Default")

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(entry.msg.sistema === "ON" ? 3 : 4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msgauto_onoff`)
                                    .setLabel(entry.msg.sistema === "ON" ? "Sistema (Ligado)" : "Sistema (Desligado)")
                                    .setEmoji(entry.msg.sistema === "ON" ? "🟢" : "🔴"),
                                new ButtonBuilder()
                                    .setStyle(2)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msgauto_alt`)
                                    .setLabel("Mensagem ")
                                    .setEmoji("✏️"),
                                new ButtonBuilder()
                                    .setStyle(4)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_msg_reset`)
                                    .setLabel("Resetar")
                                    .setEmoji("⚠️"),
                                new ButtonBuilder()
                                    .setStyle(1)
                                    .setCustomId(`${tabom}_${entry.id}_configsele_outrasopc`)
                                    
                                    .setEmoji("↩️")
                            )
                        interaction.update({ embeds: [embed], components: [row] })
                    }
                })
            }
            if (customId.endsWith("_configsele_msgauto_alt")) {
                const select = dbTickets.get(`${tabom}.select`)
                select.map(entry => {
                    if (customId.startsWith(`${tabom}_${entry.id}_`)) {
                        const modal = new ModalBuilder()
                            .setCustomId(`${tabom}_${entry.id}_configsele_msgauto_alt_modal`)
                            .setTitle("Alterar Mensagem Automática")

                        const text = new TextInputBuilder()
                            .setCustomId("text_modal")
                            .setLabel("Coloque a nova mensagem")
                            .setPlaceholder("Digite aqui ✏")
                            .setStyle(2)
                            .setValue(entry.msg.mensagem)

                        modal.addComponents(new ActionRowBuilder().addComponents(text))

                        interaction.showModal(modal)
                    }
                })
            }
            if (customId.endsWith('_configsele_categoria')) {
                let selectArray = dbTickets.get(`${tabom}.select`) || [];
                const entry = selectArray.find(item => item.id === Number(tabom2));
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Configurando Botão`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
                    .setDescription(`Selecione abaixo a categoria que você quer para ser a de criação dos tickets.`)
                    .setColor(dbConfigs.get(`ticket.color`) || "Default")

                const select = new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                            .setChannelTypes(ChannelType.GuildCategory)
                            .setCustomId(`${tabom}_${entry.id}_configsele_category`)
                            .setMaxValues(1)
                            .setPlaceholder(`Selecione uma categoria...`),
                    )
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setStyle(1)
                            .setCustomId(`${tabom}_${entry.id}_configsele_voltarr`)
                            .setEmoji("↩️")
                    )
                interaction.update({ embeds: [embed], components: [select, row] })
            }
        }

        if (interaction.customId === "voltar_config") {
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

            interaction.update({ embeds: [embed], components: [selectMenu] })
        }
    }
}