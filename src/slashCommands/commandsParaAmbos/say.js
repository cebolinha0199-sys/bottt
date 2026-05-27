const { MessageFlags, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase, } = require("wio.db");
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const { getCache } = require("../../../Functions/connect_api");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("say")
        .setDescription("Envie uma mensagem normal personalizada")
        .addChannelOption(opChannel => opChannel
            .setName("channel")
            .setDescription("Qual canal será enviado?")
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

        let channel = interaction.options.getChannel('channel')
        let mensagem;
        let imagem;
        let buttons = []
        let embed = new EmbedBuilder()
            .setTitle("Configure abaixo os campos da mensagem que deseja configurar.")
            .setFooter({
                text: "Clique em cancelar para cancelar o anúncio."
            })
            .setColor(dbConfigs.get(`ticket.color`))
        const rownormal = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`configmsg`)
                    .setLabel(`Alterar Mensagem`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`configimg`)
                    .setLabel(`Alterar Imagem`),
                new ButtonBuilder()
                    .setStyle(2)
                    .setCustomId(`configbuttons`)
                    .setLabel(`Configurar Botões`)
            )
        const rowfinal = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('cancelar')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('send')
                    .setLabel('⠀⠀⠀⠀⠀Enviar⠀⠀⠀⠀⠀')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('previw')
                    .setLabel('⠀Preview⠀')
                    .setStyle(ButtonStyle.Primary),
            )

        const msg = await interaction.reply({ embeds: [embed], components: [rownormal, rowfinal] })

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 360_000 });
        const collector2 = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 360_000 });
        collector2.on('collect', i => {
            if (i.user.id === interaction.user.id) {
                if (i.customId === "configbuttonadd") {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Adicionar Botão')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Nome do botão")
                                        .setPlaceholder(`Qual seria o nome do botão?`)
                                        .setStyle(TextInputStyle.Short),

                                )
                        )
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text2')
                                        .setRequired(false)
                                        .setLabel("Emoji do botão")
                                        .setPlaceholder(`Qual seria o emoji do botão?`)
                                        .setStyle(TextInputStyle.Short),
                                )
                        )
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text3')
                                        .setLabel("Link do botão")
                                        .setPlaceholder(`Qual seria o link do botão?`)
                                        .setStyle(TextInputStyle.Short),
                                )
                        )
                    i.showModal(modal)
                    i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(i => {
                            const nmrbutton = Number(buttons.length)
                            if (nmrbutton >= 5) {
                                i.reply({ content: `${dbEmojis.get(`13`)} **|** Não é possível adicionar mais um botão!`, flags: MessageFlags.Ephemeral })
                                return;
                            }
                            const link = i.fields.getTextInputValue('text3')
                            const emoji = i.fields.getTextInputValue('text2') || ""
                            const nome = i.fields.getTextInputValue('text')

                            let lala;
                            if (link.startsWith("https://")) {
                                lala = link
                            } else {
                                i.reply({ content: `${dbEmojis.get(`13`)} **|** Envie um link válido!`, flags: MessageFlags.Ephemeral })
                                return;
                            }
                            const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
                            if (emoji) {
                                if (emojiRegex.test(emoji)) {
                                } else if (emoji.startsWith("<")) {
                                } else {
                                    i.reply({ content: `${dbEmojis.get(`13`)} **|** Envie um emoji válido!`, flags: MessageFlags.Ephemeral })
                                    return;
                                }
                            }
                            buttons.push(
                                {
                                    nome: nome,
                                    emoji: emoji,
                                    link: link
                                }
                            )
                            let but = ""
                            buttons.map((entry, index) => { but += `**Botão ${index + 1}**\nNome: ${entry.nome}\nEmoji: ${entry.emoji || "Não tem Emoji!"}\nLink: [Aqui](${entry.link})\n\n`; })
                            const embed = new EmbedBuilder()
                                .setTitle(`Configurando Botões`)
                                .setDescription(`Aqui estão os botões:\n\n${but}`)
                                .setColor(dbConfigs.get(`color`))
                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`configbuttonadd`)
                                        .setLabel(`Adicionar Botão`)
                                        .setEmoji(dbEmojis.get(`20`)),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`configbuttonsub`)
                                        .setLabel(`Remover Botão`)
                                        .setEmoji(dbEmojis.get(`21`)),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`configbuttonvoltar`)
                                        .setLabel(`Voltar`)
                                        .setEmoji(dbEmojis.get(`29`))
                                )
                            i.deferUpdate()
                            msg.edit({ components: [row, rowfinal], embeds: [embed] })
                        })
                } else if (i.customId === "configbuttonsub") {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };
                    if (buttons.length <= 0) {
                        i.reply({ content: `${dbEmojis.get(`13`)} **|** Não é possível remover mais um botão!`, flags: MessageFlags.Ephemeral })
                        return;
                    }

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Remover Botão')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("ID do botão")
                                        .setPlaceholder(`Qual seria o id do botão?`)
                                        .setStyle(TextInputStyle.Short),
                                )
                        )
                    i.showModal(modal)
                    i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(i => {

                            const id = 1 + Number(i.fields.getTextInputValue('text'))
                            const idvdd = Number(id) - 2
                            if (isNaN(id)) {
                                i.reply({ content: `${dbEmojis.get(`13`)} **|** Coloque um número!`, flags: MessageFlags.Ephemeral })
                                return;
                            }
                            if (id < buttons.length) {
                                i.reply({ content: `${dbEmojis.get(`13`)} **|** Escreva um número entre \`${buttons.length} - 1\`!`, flags: MessageFlags.Ephemeral })
                                return;
                            }
                            if (id > buttons.length) {
                                i.reply({ content: `${dbEmojis.get(`13`)} **|** Escreva um número entre \`${buttons.length} - 1\`! 1aasd`, flags: MessageFlags.Ephemeral })
                                return;
                            }


                            buttons.splice(idvdd, 1);

                            let but = "";
                            buttons.map((entry, index) => { but += `**Botão ${index + 1}**\nNome: ${entry.nome}\nEmoji: ${entry.emoji || "Não tem Emoji!"}\nLink: [Aqui](${entry.link})\n\n`; })
                            const embed = new EmbedBuilder()
                                .setTitle(`Configurando Botões`)
                                .setDescription(`Aqui estão os botões:\n\n${but || "Nenhum até agora :("}`)
                                .setColor(dbConfigs.get(`color`))
                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`configbuttonadd`)
                                        .setLabel(`Adicionar Botão`)
                                        .setEmoji(dbEmojis.get(`20`)),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`configbuttonsub`)
                                        .setLabel(`Remover Botão`)
                                        .setEmoji(dbEmojis.get(`21`)),
                                    new ButtonBuilder()
                                        .setStyle(2)
                                        .setCustomId(`configbuttonvoltar`)
                                        .setLabel(`Voltar`)
                                        .setEmoji(dbEmojis.get(`29`))
                                )
                            i.deferUpdate();
                            msg.edit({ components: [row, rowfinal], embeds: [embed] })
                        })
                        .catch(err => { return err });
                }
            }
        })
        collector.on('collect', i => {
            if (i.user.id === interaction.user.id) {
                if (i.customId == 'cancelar') {
                    i.deferUpdate()
                    i.deleteReply()
                } else if (i.customId == 'previw') {
                    const row = new ActionRowBuilder()
                    buttons.map(entry => {
                        const button = new ButtonBuilder()
                            .setStyle(5)
                            .setLabel(entry.nome)
                            .setURL(entry.link);

                        // Só chama .setEmoji se entry.emoji estiver definido
                        if (entry.emoji) {
                            button.setEmoji(entry.emoji);
                        }

                        row.addComponents(button);
                    });
                    let sendOptions = {
                        content: mensagem,
                        flags: MessageFlags.Ephemeral
                    };
                    // Adicione a propriedade 'components' apenas se houver botões no row
                    if (row.components.length > 0) {
                        sendOptions.components = [row];
                    }
                    if (imagem) {
                        sendOptions.files = [imagem];
                    }
                    i.reply(sendOptions).catch(err => {
                        i.reply({
                            content: `${dbEmojis.get(`13`)} **|** Houve um erro ao processar o anuncio`,
                            flags: MessageFlags.Ephemeral
                        })
                    })
                } else if (i.customId == 'send') {

                    i.deleteReply()
                    const row = new ActionRowBuilder()
                    buttons.map(entry => {
                        const button = new ButtonBuilder()
                            .setStyle(5)
                            .setLabel(entry.nome)
                            .setURL(entry.link);

                        // Só chama .setEmoji se entry.emoji estiver definido
                        if (entry.emoji) {
                            button.setEmoji(entry.emoji);
                        }

                        row.addComponents(button);
                    });
                    let sendOptions = {
                        content: mensagem
                    };
                    if (imagem) {
                        sendOptions.files = [imagem];
                    }
                    // Adicione a propriedade 'components' apenas se houver botões no row
                    if (row.components.length > 0) {
                        sendOptions.components = [row];
                    }
                    i.deferUpdate()
                    channel.send(sendOptions).catch((err) => {
                        i.reply({
                            content: `${dbEmojis.get(`13`)} **|** Houve um erro ao processar o anuncio.\n\`\`\`${err.message}\`\`\``,
                            flags: MessageFlags.Ephemeral
                        })
                    })
                } else if (i.customId == 'configmsg') {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Mensagem')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Qual seria a nova mensagem?")
                                        .setStyle(2)
                                )
                        )
                    i.showModal(modal)
                    i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(i => {
                            i.deferUpdate();
                            mensagem = i.fields.getTextInputValue('text')
                        })
                        .catch(err => { return err });
                } else if (i.customId == 'configimg') {
                    const date = 'edit_' + Date.now();
                    const collectorFilter = i => {
                        return i.user.id === interaction.user.id && i.customId == date;
                    };

                    const modal = new ModalBuilder()
                        .setCustomId(date)
                        .setTitle('Imagem ')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('text')
                                        .setLabel("Qual seria a nova imagem?")
                                        .setPlaceholder(`Envie o link dela!`)
                                        .setStyle(TextInputStyle.Short)
                                )
                        )
                    i.showModal(modal)
                    i.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
                        .then(i => {
                            i.deferUpdate();
                            const link = i.fields.getTextInputValue('text')
                            if (link.startsWith("https://")) {
                                imagem = link
                            } else {
                                i.reply({ content: `${dbEmojis.get(`13`)} **|** Envie um link válido!`, flags: MessageFlags.Ephemeral })
                            }
                        })
                        .catch(err => { return err });
                } else if (i.customId === "configbuttons") {
                    let but = "Nenhum até agora :("
                    buttons.map((entry, index) => { but += `**Botão ${index + 1}**\nNome: ${entry.nome}\nEmoji: ${entry.emoji || "Não tem Emoji!"}\nLink: [Aqui](${entry.link})\n\n`; })
                    const embed = new EmbedBuilder()
                        .setTitle(`Configurando Botões`)
                        .setDescription(`Aqui estão os botões:\n\n${but || "Nenhum até agora :("}`)
                        .setColor(dbConfigs.get(`color`))
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`configbuttonadd`)
                                .setLabel(`Adicionar Botão`)
                                .setEmoji(dbEmojis.get(`20`)),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`configbuttonsub`)
                                .setLabel(`Remover Botão`)
                                .setEmoji(dbEmojis.get(`21`)),
                            new ButtonBuilder()
                                .setStyle(2)
                                .setCustomId(`configbuttonvoltar`)
                                .setLabel(`Voltar`)
                                .setEmoji(dbEmojis.get(`29`))
                        )
                    i.deferUpdate();
                    msg.edit({ components: [row, rowfinal], embeds: [embed] })
                } else if (i.customId === "configbuttonvoltar") {
                    i.deferUpdate();
                    msg.edit({ components: [rownormal, rowfinal], embeds: [embed] })
                }
            }
        })
    }
}