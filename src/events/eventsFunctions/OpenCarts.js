const { JsonDatabase } = require("wio.db");
const { OpenCart, EditQtd, AceitarEContinuar, PaginaPayment } = require("../../../Functions/Paginas/OpenCart");
const { MessageFlags, TextInputBuilder, ModalBuilder, ActionRowBuilder, TextInputStyle, InteractionType, EmbedBuilder, ButtonBuilder, AttachmentBuilder, StringSelectMenuBuilder } = require("discord.js");
const { INET } = require("sequelize");
const { CreatePayments } = require("../../../Functions/Pagamentos/AprovarPagamentos");
const { ConfigEfíStart, SetCallBack, GenerateToken, UpdatePix, ReembolsoEfi } = require("../../../Functions/Pagamentos/EfiBank.js");
const axios = require("axios");
const { paginablock, blockbank } = require("../../../Functions/Paginas/BloquearBank");
const { automsg } = require("../../../Functions/Paginas/MensagemAutomatica");
const Estatisticas = require("../../../Functions/estatisticas");
const { createPaymentLinkWithSecretKey } = require("../../../Functions/Pagamentos/Stripe");
const { PainelSales } = require("../../../Functions/Paginas/e-sales");
const { TransacoesPage } = require("../../../Functions/e-sales/TransacoesPage");
const { getCache } = require("../../../Functions/connect_api");

const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" })
const dbOpenedCarts = new JsonDatabase({ databasePath: "./databases/dbOpenedCarts.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbCoupons = new JsonDatabase({ databasePath: "./databases/dbCoupons.json" });
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {

        if (interaction.isButton()) {
            let produto = interaction.customId;
            if (await dbProducts.get(produto)) {
                await OpenCart(client, interaction, produto)
            }
        } else if (interaction.isStringSelectMenu()) {
            let produto = interaction.values[0];
            const panelId = interaction.customId;
            if (await dbProducts.get(produto)) {
                await OpenCart(client, interaction, produto, panelId)
            }
        }



        if (interaction.isButton()) {

            if (interaction.customId == 'e-salesSacar') {

                let infopg = await axios.post(
                    "https://api.e-sales.company/e-sales/saque",
                    {
                        userid: interaction.user.id
                    },
                    {
                        headers: {
                            "Authorization": "esalesAPiSquare",
                            "Content-Type": "application/json"
                        }
                    }
                ).catch(async (err) => {
                    let data = err.response.data
                    if (data.message == 'User already has saque') {
                        return interaction.reply({ content: `❌ | Você já possui um saque pendente, o mesmo foi solicitado no dia <t:${Math.floor(data.data.Saque.date / 1000)}:F>.`, ephemeral: true })
                    } else {
                        return interaction.reply({ content: `❌ | Ocorreu um erro ao conectar com o servidor do e-Sales.`, ephemeral: true })
                    }
                });


                infopg = infopg.data
                if (infopg) {

                    interaction.reply({ content: `✅ | Solicitação de saque enviada com sucesso! (O valor que será enviado e o **TOTAL DÍSPONIVEL**)\nSeu pix será enviado no **CPF** cadastrado no e-sales. Caso não tenha uma chavepix com **CPF** cadastrado saque será negado.`, ephemeral: true })
                }
            }

            if (interaction.customId == 'TermosEsales') {
                let embed = new EmbedBuilder()
                    .setTitle(`Termos de Uso e Políticas de Privacidade`)
                    .setDescription(`**Termos de Uso**\n\n- O uso do sistema de pagamentos e vendas é de responsabilidade do vendedor.\n- O sistema não se responsabiliza por qualquer tipo de problema ou erro que possa ocorrer durante o uso.\n- O usuário concorda em não utilizar o sistema para atividades ilegais ou fraudulentas.\n\n**Políticas de Privacidade**\n\n- As informações coletadas pelo sistema são utilizadas apenas para fins de operação e segurança.\n- O sistema não compartilha informações pessoais com terceiros sem o consentimento do usuário.\n - O usuário tem o direito de solicitar reembolso em até 7 dias caso o produto não seja entregue ou venha com defeito.`)

                interaction.reply({ embeds: [embed], ephemeral: true })
            }

            if (interaction.customId === 'blockbank') {

                paginablock(interaction, client)

            }
            if (interaction.customId === 'blockbank2') {

                paginablock(interaction, client, 1)

            }

            if (interaction.customId === 'blockbank22222') {

                blockbank(interaction, client)

            }


            if (interaction.customId == 'configmensagens') {
                await automsg(interaction, client, 1)
            }

            if (interaction.customId == 'configmensagens2') {
                await automsg(interaction, client)
            }

            if (interaction.customId == 'criarmsgauto') {
                const modalaAA = new ModalBuilder()
                    .setCustomId('awdwat123ransferawdawdwadaw')
                    .setTitle('Configurar Embed');

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('titulo')
                    .setLabel('Envie abaixo o Titulo da Embed')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(false)

                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('descricao')
                    .setLabel("Envie abaixo a Mensagem")
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(4000)
                    .setRequired(true)

                const newnameboteN3 = new TextInputBuilder()
                    .setCustomId('bannerembed')
                    .setLabel("Envie o Banner")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)

                const newnameboteN444 = new TextInputBuilder()
                    .setCustomId('buttomes')
                    .setLabel("Quanto tempo? (Em segundos)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(150)

                const newnameboteN4 = new TextInputBuilder()
                    .setCustomId('idchanell')
                    .setLabel("Envie o ID do canal que será enviado")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(25)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                const firstActionRow2 = new ActionRowBuilder().addComponents(newnameboteN2);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN3);
                const firstActionRow5 = new ActionRowBuilder().addComponents(newnameboteN4);
                const firstActionRow6 = new ActionRowBuilder().addComponents(newnameboteN444);
                modalaAA.addComponents(firstActionRow3, firstActionRow2, firstActionRow4, firstActionRow5, firstActionRow6);
                await interaction.showModal(modalaAA);
            }

            if (interaction.customId == 'remmsgautomatica') {
                const modalaAA = new ModalBuilder()
                    .setCustomId('awdwasdajdaawdu1111awdwadawdaw1idsjjsdua')
                    .setTitle('Configurar Mensagem Automatica');

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('tokenMP')
                    .setLabel('QUAL MENSAGEM DESEJA RETIRAR?')
                    .setPlaceholder('Envie apenas numeros.')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                modalaAA.addComponents(firstActionRow3);
                await interaction.showModal(modalaAA);
            }

            if (interaction.customId == 'gerenciarmsgautomatica') {
                const modalaAA = new ModalBuilder()
                    .setCustomId('gerenciarmensagemautomatica')
                    .setTitle('Gerenciar Mensagem Automática');

                const messageIdInput = new TextInputBuilder()
                    .setCustomId('messageId')
                    .setLabel('QUAL MENSAGEM DESEJA GERENCIAR?')
                    .setPlaceholder('Envie apenas números.')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                const firstActionRow = new ActionRowBuilder().addComponents(messageIdInput);
                modalaAA.addComponents(firstActionRow);
                await interaction.showModal(modalaAA);
            }

            if (interaction.customId.startsWith('adicionarBotao_')) {
                const messageId = interaction.customId.split('_')[1];

                const modalaAA = new ModalBuilder()
                    .setCustomId(`adicionarBotaoModal_${messageId}`)
                    .setTitle('Adicionar Botão');

                const buttonLabelInput = new TextInputBuilder()
                    .setCustomId('buttonLabel')
                    .setLabel('Nome do Botão')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(80) // Discord button label limit

                const buttonUrlInput = new TextInputBuilder()
                    .setCustomId('buttonUrl')
                    .setLabel('URL do Botão')
                    .setPlaceholder('https://exemplo.com')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                const firstActionRow = new ActionRowBuilder().addComponents(buttonLabelInput);
                const secondActionRow = new ActionRowBuilder().addComponents(buttonUrlInput);

                modalaAA.addComponents(firstActionRow, secondActionRow);
                await interaction.showModal(modalaAA);
            }

            // Handler for "Remove Button" button click
            if (interaction.customId.startsWith('removerBotao_')) {
                const messageId = interaction.customId.split('_')[1];

                const mensagens = dbConfigs.get('acoesautomaticas.mensagens');

                if (!mensagens || !mensagens[messageId - 1] || !mensagens[messageId - 1][0].buttons || mensagens[messageId - 1][0].buttons.length === 0) {
                    return interaction.reply({ content: '❌ | Não há botões para remover.', ephemeral: true });
                }

                const modalaAA = new ModalBuilder()
                    .setCustomId(`removerBotaoModal_${messageId}`)
                    .setTitle('Remover Botão');

                const buttonNumberInput = new TextInputBuilder()
                    .setCustomId('buttonToRemove')
                    .setLabel('Número do Botão a Remover')
                    .setPlaceholder('Digite o número do botão que deseja remover')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)

                const firstActionRow = new ActionRowBuilder().addComponents(buttonNumberInput);

                modalaAA.addComponents(firstActionRow);
                await interaction.showModal(modalaAA);
            }

        }



        if (interaction.type == InteractionType.ModalSubmit) {

            if (interaction.customId === 'awdwat123ransferawdawdwadaw') {
                const titulo = interaction.fields.getTextInputValue('titulo');
                const descricao = interaction.fields.getTextInputValue('descricao');
                const bannerembed = interaction.fields.getTextInputValue('bannerembed');
                const buttomes = interaction.fields.getTextInputValue('buttomes');
                const idchanell = interaction.fields.getTextInputValue('idchanell');

                if (isNaN(buttomes) == true) return interaction.reply({ content: 'O valor fornecido é incorreto, revise novamente', ephemeral: true })

                if (buttomes < 10) return interaction.reply({ content: 'O tempo mínimo para ser enviado é de 10 segundos.', ephemeral: true });

                function hasValidLink(text) {
                    const linkRegex = /(http|https):\/\/\S+/;
                    return linkRegex.test(text);
                }

                if (bannerembed !== '') {
                    if (!hasValidLink(bannerembed)) return interaction.reply({ content: 'O banner fornecido é incorreto, revise novamente', ephemeral: true })
                }

                dbConfigs.push('acoesautomaticas.mensagens', [{
                    titulo: titulo,
                    descricao: descricao,
                    bannerembed: bannerembed,
                    time: buttomes,
                    idchanell: idchanell,
                    buttons: [] // Initialize with empty buttons array
                }])

                await automsg(interaction, client)
                return interaction.followUp({ content: 'O sistema foi configurado com sucesso!', ephemeral: true })
            }

            if (interaction.customId === 'awdwasdajdaawdu1111awdwadawdaw1idsjjsdua') {
                const tokenMP = interaction.fields.getTextInputValue('tokenMP');

                if (isNaN(tokenMP) == true) return interaction.reply({ content: '❌ | Número incorreto.', ephemeral: true })

                const gggg = dbConfigs.get('acoesautomaticas.mensagens')

                if (gggg[tokenMP - 1] == undefined) return interaction.reply({ content: '❌ | Número incorreto.', ephemeral: true })

                dbConfigs.pull('acoesautomaticas.mensagens', (element, index, array) => index == tokenMP - 1)

                await automsg(interaction, client)
                return interaction.followUp({ content: 'O sistema foi configurado com sucesso!', ephemeral: true })
            }

            // New Modal Submission Handler for Message Management
            if (interaction.customId === 'gerenciarmensagemautomatica') {
                const messageId = interaction.fields.getTextInputValue('messageId');

                if (isNaN(messageId) == true) return interaction.reply({ content: '❌ | Número incorreto.', ephemeral: true })

                const mensagens = dbConfigs.get('acoesautomaticas.mensagens');

                if (!mensagens || !mensagens[messageId - 1]) {
                    return interaction.reply({ content: '❌ | Mensagem não encontrada.', ephemeral: true });
                }

                const mensagem = mensagens[messageId - 1][0];
                const buttonCount = mensagem.buttons ? mensagem.buttons.length : 0;

                // Get a preview of the content
                let contentPreview = mensagem.titulo ?
                    `**Título:** ${mensagem.titulo}\n` : '';
                contentPreview += `**Mensagem:** ${mensagem.descricao.substring(0, 100)}${mensagem.descricao.length > 100 ? '...' : ''}`;

                // Create action row with buttons for adding/removing buttons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`adicionarBotao_${messageId}`)
                            .setLabel('Adicionar Botão')
                            .setStyle(3),
                        new ButtonBuilder()
                            .setCustomId(`removerBotao_${messageId}`)
                            .setLabel('Remover Botão')
                            .setStyle(4)
                            .setDisabled(buttonCount === 0) // Disable if no buttons exist
                    );

                // List current buttons if any
                let buttonList = '';
                if (buttonCount > 0) {
                    buttonList = "\n\n**Botões Atuais:**\n";
                    mensagem.buttons.forEach((button, idx) => {
                        buttonList += `${idx + 1}. **${button.label}** - ${button.url}\n`;
                    });
                } else {
                    buttonList = "\n\n**Nenhum botão configurado para esta mensagem.**";
                }

                await interaction.reply({
                    content: `## Gerenciamento de Mensagem #${messageId}\n\n${contentPreview}${buttonList}`,
                    components: [row],
                    ephemeral: true
                });
            }

            // Handler for Adding Button Modal
            if (interaction.customId.startsWith('adicionarBotaoModal_')) {
                const messageId = interaction.customId.split('_')[1];

                const buttonLabel = interaction.fields.getTextInputValue('buttonLabel');
                const buttonUrl = interaction.fields.getTextInputValue('buttonUrl');

                // Validate URL
                function hasValidLink(text) {
                    const linkRegex = /(http|https):\/\/\S+/;
                    return linkRegex.test(text);
                }

                if (!hasValidLink(buttonUrl)) {
                    return interaction.reply({ content: '❌ | O URL fornecido é inválido.', ephemeral: true });
                }

                const mensagens = dbConfigs.get('acoesautomaticas.mensagens');

                if (!mensagens || !mensagens[messageId - 1]) {
                    return interaction.reply({ content: '❌ | Mensagem não encontrada.', ephemeral: true });
                }

                // Initialize buttons array if it doesn't exist
                if (!mensagens[messageId - 1][0].buttons) {
                    mensagens[messageId - 1][0].buttons = [];
                }

                // Discord has a limit of 25 buttons per message (5 rows of 5)
                if (mensagens[messageId - 1][0].buttons.length >= 25) {
                    return interaction.reply({
                        content: '❌ | Limite de botões atingido (máximo de 25 botões por mensagem).',
                        ephemeral: true
                    });
                }

                // Add the new button
                mensagens[messageId - 1][0].buttons.push({
                    label: buttonLabel,
                    url: buttonUrl
                });

                // Update the database
                dbConfigs.set('acoesautomaticas.mensagens', mensagens);

                // Show the updated message management screen
                const mensagem = mensagens[messageId - 1][0];
                const buttonCount = mensagem.buttons.length;

                // Get a preview of the content
                let contentPreview = mensagem.titulo ?
                    `**Título:** ${mensagem.titulo}\n` : '';
                contentPreview += `**Mensagem:** ${mensagem.descricao.substring(0, 100)}${mensagem.descricao.length > 100 ? '...' : ''}`;

                // Create action row with buttons for adding/removing buttons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`adicionarBotao_${messageId}`)
                            .setLabel('Adicionar Botão')
                            .setStyle(3),
                        new ButtonBuilder()
                            .setCustomId(`removerBotao_${messageId}`)
                            .setLabel('Remover Botão')
                            .setStyle(4)
                            .setDisabled(buttonCount === 0)
                    );

                // List current buttons
                let buttonList = "\n\n**Botões Atuais:**\n";
                mensagem.buttons.forEach((button, idx) => {
                    buttonList += `${idx + 1}. **${button.label}** - ${button.url}\n`;
                });

                await interaction.reply({
                    content: `## Gerenciamento de Mensagem #${messageId}\n\n${contentPreview}${buttonList}\n✅ Botão adicionado com sucesso!`,
                    components: [row],
                    ephemeral: true
                });
            }

            // Handler for Remove Button Modal
            if (interaction.customId.startsWith('removerBotaoModal_')) {
                const messageId = interaction.customId.split('_')[1];
                const buttonToRemove = interaction.fields.getTextInputValue('buttonToRemove');

                if (isNaN(buttonToRemove) || buttonToRemove < 1) {
                    return interaction.reply({ content: '❌ | Número de botão inválido.', ephemeral: true });
                }

                const mensagens = dbConfigs.get('acoesautomaticas.mensagens');

                if (!mensagens || !mensagens[messageId - 1]) {
                    return interaction.reply({ content: '❌ | Mensagem não encontrada.', ephemeral: true });
                }

                const mensagem = mensagens[messageId - 1][0];

                if (!mensagem.buttons || buttonToRemove > mensagem.buttons.length) {
                    return interaction.reply({ content: '❌ | Botão não encontrado.', ephemeral: true });
                }

                // Remove the button
                mensagem.buttons.splice(buttonToRemove - 1, 1);

                // Force update the database with the modified array
                dbConfigs.set('acoesautomaticas.mensagens', mensagens);

                // Print debug information
                console.log(`Botão ${buttonToRemove} removido. Restantes: ${mensagem.buttons.length} botões`);

                // Show the updated message management screen
                const buttonCount = mensagem.buttons.length;

                // Get a preview of the content
                let contentPreview = mensagem.titulo ?
                    `**Título:** ${mensagem.titulo}\n` : '';
                contentPreview += `**Mensagem:** ${mensagem.descricao.substring(0, 100)}${mensagem.descricao.length > 100 ? '...' : ''}`;

                // Create action row with buttons for adding/removing buttons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`adicionarBotao_${messageId}`)
                            .setLabel('Adicionar Botão')
                            .setStyle(3),
                        new ButtonBuilder()
                            .setCustomId(`removerBotao_${messageId}`)
                            .setLabel('Remover Botão')
                            .setStyle(4)
                            .setDisabled(buttonCount === 0)
                    );

                // List current buttons if any
                let buttonList = '';
                if (buttonCount > 0) {
                    buttonList = "\n\n**Botões Atuais:**\n";
                    mensagem.buttons.forEach((button, idx) => {
                        buttonList += `${idx + 1}. **${button.label}** - ${button.url}\n`;
                    });
                } else {
                    buttonList = "\n\n**Nenhum botão configurado para esta mensagem.**";
                }

                await interaction.reply({
                    content: `## Gerenciamento de Mensagem #${messageId}\n\n${contentPreview}${buttonList}\n✅ Botão removido com sucesso!`,
                    components: [row],
                    ephemeral: true
                });
            }

        }


        if (interaction.isStringSelectMenu()) {
            if (interaction.customId == 'blockbankBank') {
                let bancos = interaction.values

                await dbConfigs.set('vendas.payments.bankBlock', bancos)
                await paginablock(interaction, client, 1)
                interaction.followUp({ content: `✅ | Configurações e blacklist atualizada com sucesso!`, ephemeral: true })
            }
        }


        if (interaction.isButton()) {
            if (interaction.customId.startsWith('approvePurchaseManual_')) {

                const roleConfig = await dbConfigs.get(`vendas.roles.roleStaffID`)
                if (!interaction.member.roles.cache.has(roleConfig) && !await dbPerms.get(`vendas`)?.includes(interaction.user.id)) {
                    await interaction.reply({
                        content: `❌ | Você não tem permissão para aprovar está compra.`,
                        flags: MessageFlags.Ephemeral
                    })
                    return;
                }

                let idc = interaction.customId.split('_')[1]

                await CreatePayments(client, interaction.channel.id, 'SemiAutomatic', interaction, idc)
            }

            if (interaction.customId.startsWith('avaliar-')) {

                let NumberAvaliable = interaction.customId.split('-')[1];
                let channelId = interaction.customId.split('-')[2];

                await interaction.update({ content: `Avaliação: ${NumberAvaliable}`, components: [], embeds: [] })
                setTimeout(() => {
                    setTimeout(async () => {
                        try {
                            await interaction.message.delete()
                        } catch (error) {

                        }
                    })
                }, 5000);


                const dinheiroEmoji = `<:dinheiro:${dbe.get('dinheiro')}>`;
                const caixaEmoji = `<:caixa:${dbe.get('caixa')}>`;
                const userEmoji = `<:user:${dbe.get('user')}>`;
                const estrelaEmoji = `<a:estrela:${dbe.get('estrela')}>`;
                const calendarioEmoji = `<:calendario:${dbe.get('calendario')}>`;
                const paymentDate = `<t:${Math.floor(Date.now() / 1000)}:f> (<t:${Math.floor(Date.now() / 1000)}:R>)`;


                let payment = await dbOpenedCarts.get(channelId)

                let totalPrice = 0
                const productIds = Object.keys(payment.products)
                let cupomexist = await dbOpenedCarts.get(`${channelId}.purchaseCoupon.couponDiscount`)

                let allProductsNames = [];
                let logmessage5 = ``
                let serverName = client.guilds.cache.get(payment.guildId).name
                let serverIcon = client.guilds.cache.get(payment.guildId).iconURL({ dynamic: true })
                const thumbC = await dbConfigs.get(`vendas.images.thumbUrl`)
                const bannerC = await dbConfigs.get(`vendas.images.bannerUrl`)
                const colorC = await dbConfigs.get(`vendas.embeds.color`)

                for (const pId of productIds) {
                    let productDetails = await payment.products[pId];
                    const purchaseAmount = productDetails.purchaseAmount;
                    const productName = productDetails.productName;
                    totalPrice += Number(productDetails.productPrice) * Number(productDetails.purchaseAmount);

                    const formattedProductName = `${productName} x${purchaseAmount}`;
                    logmessage5 += `\`${purchaseAmount}x ${productName} | ${Number(productDetails.productPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n`
                    allProductsNames.push(formattedProductName);
                }

                let cupomDiscount = cupomexist == "none" ? 0 : cupomexist
                let totalDiscount = totalPrice * (cupomDiscount / 100)
                totalPrice = totalPrice - totalDiscount

                try {
                    dbOpenedCarts.delete(channelId)
                    let channelLogsPublic = await client.channels.fetch(dbConfigs.get(`vendas.channels.channelLogsPublicId`))
                    if (!channelLogsPublic) return
                    await channelLogsPublic.send({
                        content: `${interaction.user}`,
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: `${serverName} | Nova venda!`, iconURL: serverIcon })
                            .setDescription(
                                `⠀\n` +
                                `> ${caixaEmoji} | **Produtos comprados**\n` +
                                `> - ${allProductsNames.join(`\n`)}\n\n` +
                                `> ${dinheiroEmoji} | **Valor pago**\n` +
                                `> - R$${Number(totalPrice).toFixed(2)}\n\n` +
                                `> ${userEmoji} | **Comprador**\n` +
                                `> - ${interaction.user} | ${interaction.user.username}\n\n` +
                                `> ${estrelaEmoji} | **Avaliação do comprador**\n` +
                                `> - ${estrelaEmoji.repeat(NumberAvaliable)} (${NumberAvaliable})\n\n` +
                                `> ${calendarioEmoji} | **Pedido feito em**\n` +
                                `> - ${paymentDate}`
                            )
                            .setThumbnail(thumbC != "none" ? thumbC : "https://sem-img.com")
                            .setImage(bannerC != "none" ? bannerC : "https://sem-img.com")
                            .setColor(colorC != "none" ? colorC : "#460580")
                            .setFooter({ text: `${client.user.username} - Todos os direitos reservados.` })
                        ]
                    })

                } catch (error) {

                }
            }
        }


        if (interaction.type == InteractionType.ModalSubmit) {

            if (interaction.customId === 'stripe') {
                const stripeKey = interaction.fields.getTextInputValue('stripe1')

                if (stripeKey == '') return interaction.reply({ content: ` Ocorreu algum erro, tem certeza que colocou as informações corretas?`, ephemeral: true })

                let teste = await createPaymentLinkWithSecretKey(stripeKey, 10, 'Teste')
                if (teste.error) return interaction.reply({ content: ` Ocorreu algum erro, tem certeza que colocou as informações corretas?`, ephemeral: true })


                await dbConfigs.set(`vendas.payments.StripeKeys`, stripeKey)

                let efitoggle = await dbConfigs.get(`vendas.payments.paymentsOptions.Stripe`)
                let keys = await dbConfigs.get(`vendas.payments.StripeKeys`)

                let message = `## Configuração do Stripe\n- Status do Sistema: ${efitoggle == null ? '\`Desativado\`' : efitoggle == true ? '\`Ativado\`' : '\`Desativado\`'}\n- Chave de Acesso: ${keys == null ? '\`Não definido\`' : keys == true ? '\`Ativada\`' : `||${keys}||`}\n`

                interaction.update({ content: message, flags: [MessageFlags.Ephemeral] })

            }

            if (interaction.customId === 'efibank') {
                const clientid = interaction.fields.getTextInputValue('efibank1');
                const clientsecret = interaction.fields.getTextInputValue('efibank2');

                if (clientid == '' || clientsecret == '') return interaction.reply({ content: ` Ocorreu algum erro, tem certeza que colocou as informações corretas?`, ephemeral: true })

                await interaction.update({ content: `Agora, envie o arquivo do certificado \`.p12\` como um anexo.`, embeds: [], components: [] }).then(async () => {
                    const filter = (m) => m.author.id === interaction.user.id
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60000 })
                    collector.on('collect', async (m) => {
                        if (m.attachments.first()) {
                            const file = m.attachments.first()
                            if (file.name.endsWith(".p12")) {
                                const fs = require("fs")
                                const path = require("path")
                                const https = require("https");
                                const axios = require("axios");

                                try {
                                    m.delete();
                                    const certificadoPath = path.join(`./databases/${file.name}`);
                                    const response = await axios.get(file.url, { responseType: "arraybuffer" });
                                    fs.writeFileSync(certificadoPath, response.data);
                                    const certificadoBuffer = fs.readFileSync(certificadoPath);
                                    const agent = new https.Agent({ pfx: certificadoBuffer, passphrase: "" });

                                    const access_token = await GenerateToken(clientid, clientsecret, certificadoBuffer)

                                    const chavesPixResponse = await axios.get("https://pix.api.efipay.com.br/v2/gn/evp", {
                                        headers: {
                                            Authorization: `Bearer ${access_token}`,
                                            "Content-Type": "application/json",
                                        },
                                        httpsAgent: agent,
                                    });
                                    let chavepix = ``
                                    if (chavesPixResponse.data.chaves.length < 1) {
                                        let message = await ConfigEfíStart(client, interaction)
                                        await interaction.editReply(message)
                                        await interaction.followUp({
                                            content: `❌ Não foi possível encontrar uma chave PIX cadastrada!`,
                                            embeds: [],
                                            components: [],
                                            ephemeral: true,
                                        });
                                    } else {
                                        chavepix = chavesPixResponse.data.chaves[0]
                                    }

                                    await UpdatePix(chavepix, certificadoBuffer, access_token)

                                    await dbConfigs.set(`vendas.payments.EfiBankClientID`, clientid)
                                    await dbConfigs.set(`vendas.payments.EfiBankClientSecret`, clientsecret)
                                    await dbConfigs.set(`vendas.payments.EfiBankChavePix`, chavepix)
                                    await dbConfigs.set(`vendas.payments.EfiBankCertificado`, file.name)

                                    await SetCallBack(client)

                                    let message = await ConfigEfíStart(client, interaction)
                                    await interaction.editReply(message)
                                    await interaction.followUp({
                                        content: `✅ Certificado enviado com sucesso!`,
                                        embeds: [],
                                        components: [],
                                        ephemeral: true,
                                    });

                                } catch (error) {
                                    console.log(error)
                                    console.error("Erro:", error.message);;
                                    let message = await ConfigEfíStart(client, interaction)
                                    await interaction.editReply(message)
                                    await interaction.followUp({
                                        content: `❌ Houve um erro ao salvar as informações, tente novamente.`,
                                        ephemeral: true,
                                        embeds: [],
                                        components: [],
                                    });

                                }
                            } else {
                                let message = await ConfigEfíStart(client, interaction)
                                await interaction.editReply(message)
                                await interaction.followUp({ content: `❌ O arquivo enviado não é um certificado \`.p12\`!`, embeds: [], components: [], ephemeral: true });

                            }
                        } else {
                            let message = await ConfigEfíStart(client, interaction)
                            await interaction.editReply(message)
                            await interaction.followUp({ content: `❌ Você não enviou nenhum arquivo!`, embeds: [], components: [], ephemeral: true });

                        }
                    })
                })

            }
        }

        const dbProfiles = new JsonDatabase({ databasePath: "./databases/dbProfiles.json" });

        if (interaction.type == InteractionType.ModalSubmit) {
            if (interaction.customId.startsWith('modalAmount-')) {
                let productId = interaction.customId.split('-')[1];
                let product = await dbOpenedCarts.get(`${interaction.channel.id}.products.p-${productId}`);
                let amount = interaction.fields.getTextInputValue('amountNum');
                if (amount > product.productStock) return interaction.reply({ content: `❌ | Não é possível adicionar mais produtos do que o estoque disponível.`, ephemeral: true });
                if (amount < 1) return interaction.reply({ content: `❌ | Não é possível adicionar menos de 1 produto.`, ephemeral: true });
                product.purchaseAmount = Number(amount);
                product.purchasePrice = product.purchaseAmount * Number(product.productPrice);
                await dbOpenedCarts.set(`${interaction.channel.id}.products.p-${productId}`, product);
                await EditQtd(client, interaction, productId);
            }
        }


        if (interaction.isButton()) {

            if (interaction.customId == 'e-salesPainel') {


                let userSale = getCache(null, 'owner')
                if (!userSale) return interaction.reply({ content: `❌ | Ocorreu um erro ao conectar com o servidor do e-Sales.`, ephemeral: true })
                if (userSale !== interaction.user.id) return interaction.reply({ content: `❌ | Você precisa ser o *DONO* do bot para acessar essa configuração.`, ephemeral: true })

                await interaction.update({ content: `🔄 | Carregando informações...`, embeds: [], components: [] })
                try {
                    // monte query userid e status
                    const query = `?userid=${interaction.user.id}&status=admin`;
                    await axios.get(`https://api.e-sales.company/e-sales${query}`, {
                        headers: {
                            Authorization: 'esalesAPiSquare',
                            'Content-Type': 'application/json'
                        },

                    });
                    await PainelSales(client, interaction)
                } catch (error) {
                    console.log(error)
                    if (error?.response?.data?.message == 'User not found') {
                        let button = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(5)
                                    .setURL('https://e-sales.company/')
                                    .setLabel('Clique aqui para se cadastrar')
                            )
                        return interaction.editReply({ components: [button], content: `❌ | Você não possui autorização para utilizar está sessão.\n\n- Caso queira utilizar esse sistema cadastre-se no botão abaixo.`, ephemeral: true })
                    }

                    if (error?.response?.data?.message == 'User not verified') {
                        return interaction.editReply({ content: `❌ | Sua solicitação de verificação ainda não foi aceita.`, ephemeral: true })
                    }

                    interaction.editReply({ content: `❌ | Ocorreu um erro ao conectar com o servidor do e-Sales.`, ephemeral: true })
                }


            }


            if (interaction.customId == 'e-salesTransacoes') {

                let pages = await TransacoesPage(interaction, client, 1)

                await interaction.reply(
                    { content: pages.contentBloqueados, components: pages.componentsBloqueados, ephemeral: true }
                )

                await interaction.followUp(
                    { content: pages.contentLiberadas, components: pages.componentsLiberadas, ephemeral: true }
                )

            }

            if (interaction.customId.startsWith('paginaBloqueados_seguinte_')) {
                let page = interaction.customId.split('_')[2]
                console.log(page)
                let pages = await TransacoesPage(interaction, client, page)
                await interaction.update(
                    { content: pages.contentBloqueados, components: pages.componentsBloqueados, ephemeral: true }
                )
            } else if (interaction.customId.startsWith('paginaBloqueados_anterior_')) {
                let page = interaction.customId.split('_')[2]
                let pages = await TransacoesPage(interaction, client, page)
                await interaction.update(
                    { content: pages.contentBloqueados, components: pages.componentsBloqueados, ephemeral: true }
                )
            }

            if (interaction.customId.startsWith('paginaLiberadas_seguinte_')) {
                let page = interaction.customId.split('_')[2]
                let pages = await TransacoesPage(interaction, client, page)
                await interaction.update(
                    { content: pages.contentLiberadas, components: pages.componentsLiberadas, ephemeral: true }
                )
            } else if (interaction.customId.startsWith('paginaLiberadas_anterior_')) {
                let page = interaction.customId.split('_')[2]
                let pages = await TransacoesPage(interaction, client, page)
                await interaction.update(
                    { content: pages.contentLiberadas, components: pages.componentsLiberadas, ephemeral: true }
                )
            }



            if (interaction.customId == 'e-salesToggle') {
                await interaction.deferUpdate()
                let EsalesToggle = await dbConfigs.get(`vendas.payments.paymentsOptions.eSales`)
                if (EsalesToggle == null) {
                    await dbConfigs.set(`vendas.payments.paymentsOptions.eSales`, true)
                } else {
                    await dbConfigs.set(`vendas.payments.paymentsOptions.eSales`, !EsalesToggle)
                }

                await PainelSales(client, interaction)
            }
            if (interaction.customId == 'e-salesAtualizar') {
                await interaction.deferUpdate()
                await PainelSales(client, interaction)
            }

            if (interaction.customId == 'todayyyy' || interaction.customId == '7daysss' || interaction.customId == '30dayss' || interaction.customId == 'totalrendimento') {
                await interaction.deferUpdate()

                var rendimento = 0
                var pedidos = 0
                var produtos22 = 0



                if (interaction.customId == 'todayyyy') {
                    let oneday = await Estatisticas(client, 1, interaction.guild.id)
                    rendimento = oneday.intervalo.valorTotal
                    pedidos = oneday.intervalo.quantidadePedidos
                    produtos22 = oneday.intervalo.totalProdutos
                } else if (interaction.customId == '7daysss') {
                    let sevendays = await Estatisticas(client, 7, interaction.guild.id)
                    rendimento = sevendays.intervalo.valorTotal
                    pedidos = sevendays.intervalo.quantidadePedidos
                    produtos22 = sevendays.intervalo.totalProdutos
                } else if (interaction.customId == '30dayss') {
                    let thirydays = await Estatisticas(client, 30, interaction.guild.id)
                    rendimento = thirydays.intervalo.valorTotal
                    pedidos = thirydays.intervalo.quantidadePedidos
                    produtos22 = thirydays.intervalo.totalProdutos
                } else if (interaction.customId == 'totalrendimento') {
                    let totalrendimento = await Estatisticas(client, 0, interaction.guild.id)
                    rendimento = totalrendimento.total.valorTotal
                    pedidos = totalrendimento.total.quantidadePedidos
                    produtos22 = totalrendimento.total.totalProdutos
                }

                let diasemnumeros = 0

                if (interaction.customId == 'todayyyy') {
                    diasemnumeros = 1
                } else if (interaction.customId == '7daysss') {
                    diasemnumeros = 7
                } else if (interaction.customId == '30dayss') {
                    diasemnumeros = 30
                } else if (interaction.customId == 'totalrendimento') {
                    diasemnumeros = 0
                }

                const embed = new EmbedBuilder()
                    .setColor('#90ee90')
                    .addFields(
                        { name: `**Rendimento**`, value: `\`${Number(rendimento).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                        { name: `**Pedidos aprovados**`, value: `\`${pedidos}\``, inline: true },
                        { name: `**Produtos entregues**`, value: `\`${produtos22}\``, inline: true },
                    )
                    .setAuthor({ name: `Estatisticas de vendas dos ultimos ${diasemnumeros == 0 ? `anos` : `${diasemnumeros} dias`}`, iconURL: `https://cdn.discordapp.com/emojis/1262947958727639091.webp?size=96&quality=lossless` })
                    .setTimestamp()
                    .setFooter({ text: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}` })

                interaction.editReply({ embeds: [embed], content: `` })
            }


            if (interaction.customId.startsWith('ReembolsarCompra-')) {
                let id = interaction.customId.split('-')[1];


                let config = {
                    method: 'get',
                    maxBodyLength: Infinity,
                    url: `https://nevermiss-api.squareweb.app/getCompra/${id}`,
                    headers: {
                        'Authorization': 'wj5O7E82dG4t'
                    }
                };

                let req = await axios.request(config)

                if (req.data.typeBank == "SemiAutomatic" || req.data.typeBank == "saldo2") {
                    await interaction.reply({ content: `🔃 | Reembolsando`, ephemeral: true })
                    dbProfiles.add(`${req.data.user_id}.balance`, req.data.price)
                    await interaction.editReply({ content: `✅ | Reembolso efetuado com sucesso!`, ephemeral: true })
                    await interaction.editReply({ message: interaction.message, components: [], content: `✅ | Reembolso efetuado com sucesso! Resp. \`${interaction.user.id}\``, ephemeral: true })
                }

                if (req.data.typeBank == "efiBank") {
                    await interaction.reply({ content: `🔃 | Reembolsando...`, ephemeral: true })
                    await ReembolsoEfi(id, client)
                    await interaction.editReply({ content: `✅ | Reembolso efetuado com sucesso!`, ephemeral: true })
                    await interaction.editReply({ message: interaction.message, components: [], content: `✅ | Reembolso efetuado com sucesso! Resp. \`${interaction.user.id}\``, ephemeral: true })
                }

                if (req.data.typeBank == "mercadoPago") {
                    await interaction.reply({ content: `🔃 | Reembolsando...`, ephemeral: true })
                    const tokenMp = await dbConfigs.get(`vendas.payments.mpAcessToken`);
                    const urlReembolso = `https://api.mercadopago.com/v1/payments/${id}/refunds`;
                    const headers = {
                        Authorization: `Bearer ${tokenMp}`,
                    };
                    const body = {
                        metadata: {
                            reason: 'Motivo do reembolso',
                        },
                    };
                    axios.post(urlReembolso, body, { headers })
                        .then(async response => {

                            await interaction.editReply({ content: `✅ | Reembolso efetuado com sucesso!`, ephemeral: true })
                            await interaction.editReply({ message: interaction.message, components: [], content: `✅ | Reembolso efetuado com sucesso! Resp. \`${interaction.user.id}\``, ephemeral: true })
                        })
                        .catch(async error => {
                            await interaction.editReply({ content: `❌ | Ocorreu um erro ao reembolsar a compra.`, ephemeral: true })
                        })
                }
            }


            if (interaction.customId === 'saldoConfirmNao') {
                await PaginaPayment(client, interaction);
            } else if (interaction.customId === 'saldoConfirmSim') {
                CreatePayments(client, interaction.channel.id, 'saldo2', interaction);
            }

            if (interaction.customId === 'EfiMethod') {
                interaction.reply(await ConfigEfíStart(client, interaction))
            }
            if (interaction.customId === 'stripeMethod') {

                let efitoggle = await dbConfigs.get(`vendas.payments.paymentsOptions.Stripe`)
                let keys = await dbConfigs.get(`vendas.payments.StripeKeys`)

                let message = `## Configuração do Stripe\n- Status do Sistema: ${efitoggle == null ? '\`Desativado\`' : efitoggle == true ? '\`Ativado\`' : '\`Desativado\`'}\n- Chave de Acesso: ${keys == null ? '\`Não definido\`' : keys == true ? '\`Ativada\`' : `||${keys}||`}\n`

                let components1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('StripeConfigToggle')
                            .setLabel('Ativar/Desativar Stripe')
                            .setStyle(2)
                    )
                let components2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('StripeConfig')
                            .setLabel('Autorizar Stripe')
                            .setStyle(1)
                    )

                interaction.reply({ content: message, flags: [MessageFlags.Ephemeral], components: [components1, components2] })
            }

            if (interaction.customId === 'StripeConfigToggle') {
                let stripeToggle = await dbConfigs.get(`vendas.payments.paymentsOptions.Stripe`)
                if (stripeToggle == null) {
                    await dbConfigs.set(`vendas.payments.paymentsOptions.Stripe`, true)

                    let efitoggle = await dbConfigs.get(`vendas.payments.paymentsOptions.Stripe`)
                    let keys = await dbConfigs.get(`vendas.payments.StripeKeys`)

                    let message = `## Configuração do Stripe\n- Status do Sistema: ${efitoggle == null ? '\`Desativado\`' : efitoggle == true ? '\`Ativado\`' : '\`Desativado\`'}\n- Chave de Acesso: ${keys == null ? '\`Não definido\`' : keys == true ? '\`Ativada\`' : `||${keys}||`}\n`

                    interaction.update({ content: message, flags: [MessageFlags.Ephemeral] })
                } else {
                    await dbConfigs.set(`vendas.payments.paymentsOptions.Stripe`, !stripeToggle)

                    let efitoggle = await dbConfigs.get(`vendas.payments.paymentsOptions.Stripe`)
                    let keys = await dbConfigs.get(`vendas.payments.StripeKeys`)

                    let message = `## Configuração do Stripe\n- Status do Sistema: ${efitoggle == null ? '\`Desativado\`' : efitoggle == true ? '\`Ativado\`' : '\`Desativado\`'}\n- Chave de Acesso: ${keys == null ? '\`Não definido\`' : keys == true ? '\`Ativada\`' : `||${keys}||`}\n`

                    interaction.update({ content: message, flags: [MessageFlags.Ephemeral] })
                }
            }

            if (interaction.customId === 'StripeConfig') {
                const modalaAA = new ModalBuilder()
                    .setCustomId('stripe')
                    .setTitle(`Autorizar Stripe`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('stripe1')
                    .setLabel("Chave de Acesso")
                    .setPlaceholder("sk_live_51KGa1wLskRtpAYX.....")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN);
                modalaAA.addComponents(firstActionRow4);
                await interaction.showModal(modalaAA);


            }


            if (interaction.customId == 'EfíBankConfig') {
                const modalaAA = new ModalBuilder()
                    .setCustomId('efibank')
                    .setTitle(`Autorizar Efi Bank`);

                const newnameboteN = new TextInputBuilder()
                    .setCustomId('efibank1')
                    .setLabel("CLIENT ID")
                    .setPlaceholder("Client_Id_XxxXxXx")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(256)
                const newnameboteN2 = new TextInputBuilder()
                    .setCustomId('efibank2')
                    .setLabel("CLIENT SECRET")
                    .setPlaceholder("Client_Secret_XxxXxXx")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(256)

                const firstActionRow3 = new ActionRowBuilder().addComponents(newnameboteN);
                modalaAA.addComponents(firstActionRow3);
                const firstActionRow4 = new ActionRowBuilder().addComponents(newnameboteN2);
                modalaAA.addComponents(firstActionRow4);
                await interaction.showModal(modalaAA);


            }

            if (interaction.customId === 'EfíBankStatus') {
                if (await dbConfigs.get(`vendas.payments.EfiBankClientSecret`) == null && await dbConfigs.get(`vendas.payments.EfiBankClientID`) == null) return interaction.reply({ content: `❌ | Licença não encontrada!`, ephemeral: true })


                let status = await dbConfigs.get(`vendas.payments.paymentsOptions.EfiBank`)
                if (status == null) {
                    await dbConfigs.set(`vendas.payments.paymentsOptions.EfiBank`, true)
                    interaction.update(await ConfigEfíStart(client, interaction))
                } else {
                    await dbConfigs.set(`vendas.payments.paymentsOptions.EfiBank`, !status)
                    interaction.update(await ConfigEfíStart(client, interaction))
                }
            }

            if (interaction.customId.startsWith('selectpayment-')) {
                let paymentType = interaction.customId.split('-')[1];
                await CreatePayments(client, interaction.channel.id, paymentType, interaction);
            }

            if (interaction.customId === 'qrCode2') {
                const qrCode = await dbOpenedCarts.get(`${interaction.channel.id}.Qrcode`);
                const buffer = Buffer.from(qrCode, "base64");
                const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
                await interaction.reply({ files: [attachment], ephemeral: true });
            }

            if (interaction.customId === 'copiaCola') {
                const copiaCola = await dbOpenedCarts.get(`${interaction.channel.id}.CopiaECola`);
                await interaction.reply({ content: `${copiaCola}`, ephemeral: true });
            }

            if (interaction.customId === 'cancelPayment') {
                await dbOpenedCarts.delete(interaction.channel.id);
                await interaction.channel.delete();
            }




            if (interaction.customId === 'toPayment') {
                await PaginaPayment(client, interaction);
                return;
            }

            if (interaction.customId === 'addCoupon') {

                let collect = interaction.reply({ content: `Envie abaixo o código do cupom que deseja utilizar:`, ephemeral: true });
                const filter = m => m.author.id === interaction.user.id;
                const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

                collector.on('collect', async m => {
                    collector.stop();
                    const msgContent = m.content.trim().toLowerCase()
                    m.delete();
                    if (!dbCoupons.has(msgContent)) {
                        return await interaction.editReply({ content: `❌ | Cupom inválido.`, ephemeral: true });

                    }

                    const oCouponStock = await dbCoupons.get(`${msgContent}.stock`);
                    if (oCouponStock <= 0) {
                        return await interaction.editReply({ content: `❌ | Cupom esgotado.`, ephemeral: true });

                    }


                    const roleCoupon = await dbCoupons.get(`${msgContent}.role`);
                    if (roleCoupon != `none`) {
                        const roleGuild = interaction.guild.roles.cache.get(roleCoupon);
                        if (roleGuild) {
                            const memberGuild = interaction.guild.members.cache.get(interaction.user.id);

                            if (!memberGuild.roles.cache.has(roleGuild.id)) {

                                return await interaction.editReply({ content: `❌ | Você não possui o cargo necessário para utilizar este cupom.`, ephemeral: true });

                            }
                        }
                    }

                    const minimumPurchaseCoupon = await dbCoupons.get(`${msgContent}.minimumPurchase`);


                    let CartOn = dbOpenedCarts.get(`${interaction.channel.id}`);
                    const productIds = Object.keys(CartOn.products)
                    let totalPrice = 0;

                    for (const pId of productIds) {
                        let productDetails = await CartOn.products[pId];
                        totalPrice += Number(productDetails.productPrice) * Number(productDetails.purchaseAmount);
                    }



                    if (minimumPurchaseCoupon != `none`) {
                        if (totalPrice < Number(minimumPurchaseCoupon).toFixed(2)) {
                            return await interaction.editReply({ content: `❌ | O valor total da compra deve ser de no mínimo ${Number(minimumPurchaseCoupon).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}.`, ephemeral: true });

                        }
                    }


                    await dbCoupons.substr(`${msgContent}.stock`, 1);


                    const oCouponDiscount = await dbCoupons.get(`${msgContent}.discount`);

                    couponUsed = msgContent;

                    await dbOpenedCarts.set(`${interaction.channel.id}.purchaseCoupon.couponId`, msgContent);
                    await dbOpenedCarts.set(`${interaction.channel.id}.purchaseCoupon.couponDiscount`, oCouponDiscount);

                    const pCouponId = await dbOpenedCarts.get(`${interaction.channel.id}.purchaseCoupon.couponId`);
                    const pCouponDiscount = await dbOpenedCarts.get(`${interaction.channel.id}.purchaseCoupon.couponDiscount`);

                    totalPrice = Math.round(Number(totalPrice) * (1 - Number(pCouponDiscount) / 100) * 100) / 100;


                    let fields = interaction.message.embeds[0].data.fields
                    let valorTotalField = fields.find(field => field.name === 'Valor total');


                    valorTotalField.value = `~~${valorTotalField.value}~~ \`${Number(totalPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``;




                    const carrinhoEmoji = `<:carrinho:${await dbe.get('carrinho')}>`;
                    const cupomEmoji = `<:cupom:${await dbe.get('cupom')}>`;
                    const cancelarEmoji = `<:cancelar:${await dbe.get('cancelar')}>`;

                    const rowResumeProduct = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`toPayment`).setLabel(`Ir para o Pagamento`).setEmoji(`${carrinhoEmoji}`).setStyle(`Success`),
                            new ButtonBuilder().setCustomId(`addCoupon`).setLabel(`Adicionar Cupom de Desconto`).setEmoji(`${cupomEmoji}`).setStyle(`Primary`).setDisabled(true),
                            new ButtonBuilder().setCustomId(`cancelCart`).setLabel(`Cancelar Compra`).setEmoji(`${cancelarEmoji}`).setStyle(`Danger`)
                        );

                    await interaction.editReply({
                        embeds: [new EmbedBuilder(interaction.message.embeds[0])
                            .setFields(fields)
                        ],
                        components: [rowResumeProduct],
                        message: interaction.message
                    });

                    interaction.editReply({ content: `✅ | Cupom aplicado com sucesso.`, ephemeral: true });


                })
                collector.on('end', async collected => {
                    if (collected.size == 0) {
                        await interaction.editReply({ content: `❌ | Tempo esgotado.`, ephemeral: true });
                    }
                });

            }


            if (interaction.customId === 'acceptContinue') {
                await AceitarEContinuar(client, interaction);
            }

            if (interaction.customId === 'cancelCart') {
                let cart = await dbOpenedCarts.get(interaction.channel.id);
                const createdDate = `<t:${Math.floor(cart.createdDate / 1000)}:f> (<t:${Math.floor(cart.createdDate / 1000)}:R>)`;
                await dbOpenedCarts.delete(interaction.channel.id);
                await interaction.channel.delete();
                const channelLogsPriv = interaction.guild.channels.cache.get(dbConfigs.get(`vendas.channels.channelLogsPrivId`));
                if (channelLogsPriv) {
                    await channelLogsPriv.send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: `${interaction.user.username} - ${interaction.user.id}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })
                            .setTitle(`${client.user.username} | Compra Cancelada`)
                            .addFields(
                                { name: `👤 | COMPRADOR(A):`, value: `${interaction.user} | ${interaction.user.username}` },
                                { name: `📜 | Motivo:`, value: `Cancelada pelo comprador.` },
                                { name: `⏰ | Data & Horário:`, value: `${createdDate}` }
                            )
                            .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                            .setColor(`Red`)
                            .setTimestamp()
                        ]
                    });
                };
            }

            if (interaction.customId == 'viewTerms') {
                const termsPurchase = await dbConfigs.get(`vendas.termsPurchase`);
                const colorC = await dbConfigs.get(`vendas.embeds.color`)

                const embedTerms = new EmbedBuilder()
                    .setTitle(`${client.user.username} | Termos`)
                    .setDescription(termsPurchase != "none" ? termsPurchase : "Não configurado.")
                    .setColor(colorC !== "none" ? colorC : "#460580");

                await interaction.reply({
                    embeds: [embedTerms],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (interaction.customId.startsWith('editAmount-')) {
                let productId = interaction.customId.split('-')[1];
                const purchaseName = await dbOpenedCarts.get(`${interaction.channel.id}.products.p-${productId}.productName`);

                const modalAmount = new ModalBuilder()
                    .setCustomId(`modalAmount-${productId}`)
                    .setTitle(`📦 | ${purchaseName}`)

                const inputAmount = new TextInputBuilder()
                    .setCustomId('amountNum')
                    .setLabel(`Quantidade:`)
                    .setMaxLength(3)
                    .setPlaceholder(`Exemplo: 10`)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short)

                const iAmountNum = new ActionRowBuilder().addComponents(inputAmount);

                modalAmount.addComponents(iAmountNum);

                await interaction.showModal(modalAmount);
            }

            if (interaction.customId.startsWith('delProduct-')) {
                let productId = interaction.customId.split('-')[1];
                await dbOpenedCarts.delete(`${interaction.channel.id}.products.p-${productId}`);
                interaction.message.delete()
            }

            if (interaction.customId.startsWith('addOne-')) {
                let productId = interaction.customId.split('-')[1];
                let product = await dbOpenedCarts.get(`${interaction.channel.id}.products.p-${productId}`);
                product.purchaseAmount += 1;
                if (product.purchaseAmount > product.productStock) return interaction.reply({ content: `❌ | Não é possível adicionar mais produtos do que o estoque disponível.`, ephemeral: true });
                product.purchasePrice = product.purchaseAmount * Number(product.productPrice);
                await dbOpenedCarts.set(`${interaction.channel.id}.products.p-${productId}`, product);
                await EditQtd(client, interaction, productId);
            }

            if (interaction.customId.startsWith('removeOne-')) {
                let productId = interaction.customId.split('-')[1];
                let product = await dbOpenedCarts.get(`${interaction.channel.id}.products.p-${productId}`);
                if (product.purchaseAmount == 1) return interaction.reply({ content: `❌ | Não é possível remover mais produtos.`, ephemeral: true });
                product.purchaseAmount -= 1;
                product.purchasePrice = product.purchaseAmount * Number(product.productPrice);
                await dbOpenedCarts.set(`${interaction.channel.id}.products.p-${productId}`, product);
                await EditQtd(client, interaction, productId);
            }


            if (interaction.customId.startsWith(`enableNotifications-`)) {
                let productId = interaction.customId.split('-')[1];
                const notificationUsers = await dbProducts.get(`${productId}.notificationUsers.${interaction.user.id}`);
                if (notificationUsers == null) {
                    await dbProducts.set(`${productId}.notificationUsers.${interaction.user.id}`, interaction.user.id);

                    await interaction.reply({
                        content: `✅ | Notificações ativadas com sucesso.`,
                        components: [],
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    dbProducts.delete(`${productId}.notificationUsers.${interaction.user.id}`);
                    await interaction.reply({
                        content: `✅ | As notificações já estavam ativadas anteriormente e foram desativadas. Se desejar reativá-las, basta clicar novamente no botão!`,
                        components: [],
                        flags: MessageFlags.Ephemeral
                    });
                };
            };
        }


    }
}