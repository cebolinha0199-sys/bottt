const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder } = require("discord.js")
const { JsonDatabase } = require("wio.db");
const { name } = require("../../src/events/eventsFunctions/botconfig.event");

const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });


async function ConfigPayments(client, interaction) {
    const colorC = await dbConfigs.get(`vendas.embeds.color`)
    const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;
    const saco_dinheiro = `<:saco_dinheiro:${await dbe.get('saco_dinheiro')}>`;
    const mercadopagoEmoji = `<:mercadopago:${await dbe.get('mercadopago')}>`;
    const explorarEmoji = `<:explorar:${await dbe.get('explorar')}>`;
    const efiEMoji = `<:efi:${await dbe.get('efi')}>`;
    const mpEmoji = `<:mp:${await dbe.get('mp')}>`;
    const pgEmoji = `<:pagbank:${await dbe.get('pg')}>`;
    const StripeEMoji = `<:stripe:${await dbe.get('stripe')}>`;
    const NubankEMoji = `<:nubank:${await dbe.get('nb')}>`;

    const rowPaymentsMethods = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`mpMethod`).setLabel(`Mercado Pago`).setEmoji(`1326905817756074036`).setStyle(2),
            new ButtonBuilder().setCustomId(`EfiMethod`).setLabel(`Efí Bank`).setEmoji(`1326905361596284990`).setStyle(2).setDisabled(false),
            new ButtonBuilder().setCustomId(`stripeMethod`).setLabel(`Stripe`).setEmoji(`<:stripe:1356704539155234844>`).setStyle(2).setDisabled(false),
            new ButtonBuilder().setCustomId(`semiAutoMethod`).setLabel(`Semi-Automático`).setEmoji(`<:1225477825285328979:1289647475765936321>`).setStyle(2),
        )

    const rowPaymentsMethods2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`NubankMethod`).setLabel(`Nubank & Picpay`).setEmoji(`<:nubanck:1356704539155234844>`).setStyle(2),
        )

    const embedPaymentsMethods2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`balanceMethod`).setLabel(`Saldo`).setEmoji(`<:wallet:1371950748107145297>`).setStyle(2),
            new ButtonBuilder().setCustomId(`blockbank`).setLabel(`Bloquear Banco`).setEmoji(`<:banco:1334665466425114705>`).setStyle(2),
            new ButtonBuilder().setCustomId(`lenguageMoeda`).setLabel(`Selecionar Moeda`).setEmoji(`<:moedas:1365017113605046302>`).setStyle(2),
            new ButtonBuilder().setCustomId(`previousPaymentMethods`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1),
        )

    // const voltar = new ActionRowBuilder()
    //     .addComponents(
    //         new ButtonBuilder().setCustomId(`previousPaymentMethods`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1)
    //     )

    const embedPaymentsMethods = new EmbedBuilder()
        .setTitle(`Configurações de Pagamentos`)
        .setDescription(`Sejá Bem-Vindo ${interaction.user}, selecione abaixo qual banco você deseja configurar!`)
        .addFields(
            { name: `${mpEmoji} Mercado Pago`, value: "Possuímos o sistema automático do Mercado Pago para automatizar suas vendas.", inline: true },
            { name: `${efiEMoji} EFÍ Bank`, value: "Possuímos o sistema automático do EFÍ Bank para automatizar suas vendas.", inline: true },
            { name: `${StripeEMoji} Stripe`, value: "Possuímos o sistema automático do Stripe para automatizar suas vendas.", inline: true },
            { name: `${NubankEMoji} Nubank e Picpay`, value: "Possuímos o sistema automático do Nubank e Picpay para automatizar suas vendas.", inline: true },
        )
        .setColor(colorC !== "none" ? colorC : "#460580")
        .setTimestamp()

    return {
        embeds: [embedPaymentsMethods],
        content: ``,
        components: [rowPaymentsMethods, rowPaymentsMethods2, embedPaymentsMethods2]
    }
}

async function PainelVendasMain(client, interaction) {
    const colorC = await dbConfigs.get(`vendas.embeds.color`)
    const mensagem = `<:mensagem:${await dbe.get('mensagem')}>`;
    const docEmoji = `<:doc:${await dbe.get('doc')}>`;
    const desligado = `<:desligado:${await dbe.get('desligado')}>`;
    const ligado = `<:ligado:${await dbe.get('ligado')}>`;
    const config = `<:config:${await dbe.get('config')}>`;
    const saco_dinheiro = `<:saco_dinheiro:${await dbe.get('saco_dinheiro')}>`;
    const suporte = `<:suporte:${await dbe.get('suporte')}>`;
    const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;
    const onEmoji = `<:on:${await dbe.get('on')}>`;
    const offEmoji = `<:off:${await dbe.get('off')}>`;

    const statusNewSales = await dbConfigs.get(`vendas.newSales`)

    const rowConfig1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`toggleNewSales`).setLabel(`Sistema`).setEmoji(statusNewSales ? '<:ligado:1371937192959545415>' : '<:desligado:1371937191160184945>').setStyle(statusNewSales ? `Success` : `Danger`),
            new ButtonBuilder().setCustomId(`configPayments`).setLabel(`Métodos de Pagamento`).setEmoji(`<:wallet:1371950748107145297>`).setStyle(2),
            new ButtonBuilder().setCustomId(`configChannels`).setLabel(`Canais & Cargos`).setEmoji(`<:1289381400801316966:1364987306951442464>`).setStyle(2),
        )

    const rowConfig2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`buttonDuvidas`).setLabel(`Botão de Dúvidas`).setEmoji(`<:1289359625937747989:1364987316984352850>`).setStyle(2),
            new ButtonBuilder().setCustomId(`changeTerms`).setLabel(`Termos de Compra`).setEmoji(`<:1225477825285328979:1364987272260358334>`).setStyle(2),
            new ButtonBuilder().setCustomId(`voltarconfiginicio`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1)
        )

    const rowConfig3 = new ActionRowBuilder()
    // .addComponents(
    //     // botáo de voltar
    //     new ButtonBuilder().setCustomId(`toggleNewSales`).setLabel(`Sistema ON/OFF`).setEmoji(`${config}`).setStyle(statusNewSales ? `Success` : `Danger`),
    //     new ButtonBuilder().setCustomId(`voltarconfiginicio`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1)
    // )

    const embedConfig = new EmbedBuilder()
        .setTitle(`Configurações do Plano de Vendas`)
        .setDescription(`Bem-vindo ao painel de configurações do sistema de vendas. Utilize as opções abaixo para personalizar seu sistema.`)
        .addFields(
            // Status do sistema
            {
                name: 'Status do Sistema',
                value: statusNewSales ? `\`Ativo 🟢\`` : `\`Inativo 🔴\``,
                inline: false
            },

            // Seção de configurações principais
            {
                name: 'Configurações Principais',
                value: [
                    `**Métodos de Pagamento** - Configure as formas de pagamento aceitas`,
                    `**Canais e Cargos** - Defina canais e permissões de acesso`,
                    `**Termos de Compra** - Personalize os termos e condições`,
                    `**Botão de Dúvidas** - Configure o canal para atendimento`
                ].join('\n'),
                inline: false
            }
        )

        .setColor(colorC !== "none" ? colorC : "#460580")
        .setFooter({ text: 'Clique nos botões abaixo para acessar cada configuração' })
        .setTimestamp()

    return {
        embeds: [embedConfig],
        components: [rowConfig1, rowConfig2],
        files: []
    }

}

async function mpMethod(client, interaction) {

    const colorC = await dbConfigs.get(`vendas.embeds.color`)
    const modalEmoji = `<:modal:${await dbe.get('modal')}>`;
    const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;
    const pixEmoji = `<:pix:${await dbe.get('pix')}>`;
    const chaveEmoji = `<:chave:${await dbe.get('chave')}>`;
    const ligadoEmoji = `<:on:${await dbe.get('on')}>`;
    const desligadoEmoji = `<:off:${await dbe.get('off')}>`;


    const pixPayment = await dbConfigs.get(`vendas.payments.paymentsOptions.pix`)
    const sitePayment = await dbConfigs.get(`vendas.payments.paymentsOptions.site`)
    const accessTokenPayment = await dbConfigs.get(`vendas.payments.mpAcessToken`)

    const rowPaymentsMP = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`togglePix`).setLabel(`Sistema [ON/OFF]`).setEmoji(`<:1286165967092846654:1289647485064708207>`).setStyle(pixPayment ? `Success` : `Danger`),
            new ButtonBuilder().setCustomId(`changeAccessToken`).setLabel(`Access Token`).setEmoji(`${chaveEmoji}`).setStyle(2),
            new ButtonBuilder().setCustomId(`previousPaymentMP`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1),
        )

    const embedPaymentsMP = new EmbedBuilder()
        .setTitle(`Configurando o Mercado Pago`)
        .addFields(
            { name: 'Sistema', value: pixPayment ? `Ligado ${ligadoEmoji}` : `Desligado ${desligadoEmoji}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: 'Access Token', value: accessTokenPayment != 'none' ? `||${accessTokenPayment}||` : '||Não configurado.||', inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: 'Bancos Bloqueados', value: '__Inter__ & __Pic Pay__', inline: false }
        )
        .setColor(colorC !== "none" ? colorC : "#460580")
        .setFooter({ text: `Configure usando os botões abaixo.` })

    return {
        embeds: [embedPaymentsMP],
        components: [rowPaymentsMP]
    }

}

async function togglePixMP() {

    const pixPayment = await dbConfigs.get(`vendas.payments.paymentsOptions.pix`)
    pixPayment !== false ? await dbConfigs.set(`vendas.payments.paymentsOptions.pix`, false) : await dbConfigs.set(`vendas.payments.paymentsOptions.pix`, true)
}

async function ModalMP(client, interaction) {
    const modal = new ModalBuilder()
        .setCustomId(`modalAccessToken`)
        .setTitle(`🔑 | Access Token`)

    const inputAccessToken = new TextInputBuilder()
        .setCustomId('accessTokenText')
        .setLabel(`Access Token: (MP)`)
        .setMaxLength(300)
        .setPlaceholder(`Insira seu access token ...`)
        .setRequired(true)
        .setStyle(`Paragraph`)

    const iAccessToken = new ActionRowBuilder()
        .addComponents(inputAccessToken)

    modal.addComponents(iAccessToken)
    await interaction.showModal(modal)
}

async function SaldoPayment(client, interaction) {
    const colorC = await dbConfigs.get(`vendas.embeds.color`)
    const dinheiroEmoji = `<:dinheiro:${await dbe.get('dinheiro')}>`;
    const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;
    const saco_dinheiro = `<:saco_dinheiro:${await dbe.get('saco_dinheiro')}>`;
    const presenteEmoji = `<:presente:${await dbe.get('presente')}>`;
    const ligadoEmoji = `<:on:${await dbe.get('on')}>`;
    const desligadoEmoji = `<:off:${await dbe.get('off')}>`;


    const balancePayment = await dbConfigs.get(`vendas.payments.paymentsOptions.balance`)
    const balanceBonusDeposit = await dbConfigs.get(`vendas.balance.bonusDeposit`) || 0;
    const balanceMinimumDeposit = await dbConfigs.get(`vendas.balance.minimumDeposit`) || 0;

    const rowPaymentsBalance = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`minimumDeposit`).setLabel(`Valor Mínimo de Depósito`).setEmoji(`${dinheiroEmoji}`).setStyle(2),
            new ButtonBuilder().setCustomId(`depositBonus`).setLabel(`Bônus por Depósito`).setEmoji(`${presenteEmoji}`).setStyle(2),

        )

    const rowPaymentsBalance2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`toggleBalance`).setLabel(`Sistema [ON/OFF]`).setEmoji(`${saco_dinheiro}`).setStyle(balancePayment ? `Success` : `Danger`),
            new ButtonBuilder().setCustomId(`previousPaymentMP`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1),
        )


    const embedPaymentsBalance = new EmbedBuilder()
        .setTitle(`Configuração Sistema de Saldo`)
        .addFields(
            { name: 'Sistema', value: balancePayment ? `Ligado ${ligadoEmoji}` : `Desligado ${desligadoEmoji}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: 'Bônus por Depósito', value: `\`${Number(balanceBonusDeposit)}%\``, inline: true },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: 'Valor Mínimo de Depósito', value: `\`R$${Number(balanceMinimumDeposit).toFixed(2)}\``, inline: false }
        )
        .setColor(colorC !== "none" ? colorC : "#460580")
        .setFooter({ text: `Configure usando os botões abaixo.` })

    return {
        embeds: [embedPaymentsBalance],
        components: [rowPaymentsBalance, rowPaymentsBalance2]
    }
}

function toggleBalance() {
    const balancePayment = dbConfigs.get(`vendas.payments.paymentsOptions.balance`)
    balancePayment !== false ? dbConfigs.set(`vendas.payments.paymentsOptions.balance`, false) : dbConfigs.set(`vendas.payments.paymentsOptions.balance`, true)
}

async function depositBonus(client, interaction) {
    const modal = new ModalBuilder()
        .setCustomId(`modalBonusDeposit`)
        .setTitle(`Bônus por Depósito`)

    const inputBonusDeposit = new TextInputBuilder()
        .setCustomId('bonusDepositNum')
        .setLabel(`Bônus por Depósito:`)
        .setMaxLength(3)
        .setPlaceholder(`Exemplo: 25`)
        .setRequired(true)
        .setStyle(`Paragraph`)

    const iBonusDeposit = new ActionRowBuilder()
        .addComponents(inputBonusDeposit)
    modal.addComponents(iBonusDeposit)

    await interaction.showModal(modal)
}

async function minimumDeposit(client, interaction) {
    const modal = new ModalBuilder()
        .setCustomId(`modalMinimumDeposit`)
        .setTitle(`Valor Mínimo de Depósito`)

    const inputMinimumDeposit = new TextInputBuilder()
        .setCustomId('minimumDepositNum')
        .setLabel(`Valor Mínimo de Depósito:`)
        .setMaxLength(6)
        .setPlaceholder(`Exemplo: 50.00`)
        .setRequired(true)
        .setStyle(`Paragraph`)

    const iMinimumDeposit = new ActionRowBuilder()
        .addComponents(inputMinimumDeposit)

    modal.addComponents(iMinimumDeposit)
    await interaction.showModal(modal)
}

async function semiAutoMethod(client, interaction) {

    const colorC = await dbConfigs.get(`vendas.embeds.color`)
    const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;
    const qrcodeEmoji = `<:qrcode:${await dbe.get('qrcode')}>`;
    const explorarEmoji = `<:explorar:${await dbe.get('explorar')}>`;
    const pixEmoji = `<:pix:${await dbe.get('pix')}>`;
    const ligadoEmoji = `<:on:${await dbe.get('on')}>`;
    const desligadoEmoji = `<:off:${await dbe.get('off')}>`;

    const semiAutoPayment = await dbConfigs.get(`vendas.payments.paymentsOptions.semiAuto`)

    const semiAutoPix = await dbConfigs.get(`vendas.semiAuto.pix.key`)
    const semiAutoPixType = await dbConfigs.get(`vendas.semiAuto.pix.keyType`)
    const semiAutoQRCode = await dbConfigs.get(`vendas.semiAuto.qrCode`)

    const rowPaymentsSemiAuto = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`changePix`).setLabel(`Configurar Chave Pix`).setEmoji(`${pixEmoji}`).setStyle(2),
            new ButtonBuilder().setCustomId(`changeQrCode`).setLabel(`Configurar QR Code`).setEmoji(`${qrcodeEmoji}`).setStyle(2),
        )
    //crie outra parte de botoes
    const rowPaymentsSemiAuto2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`toggleSemiAuto`).setLabel(`Sistema [ON/OFF]`).setEmoji(`<:1225477825285328979:1289647475765936321>`).setStyle(semiAutoPayment ? `Success` : `Danger`),
            new ButtonBuilder().setCustomId(`previousPaymentMP`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1),
        )

    const embedPaymentsSemiAuto = new EmbedBuilder()
        .setTitle(`Configurando Semi-Auto`)
        .addFields(
            { name: 'Status', value: semiAutoPayment ? `Ligado ${ligadoEmoji}` : `Desligado ${desligadoEmoji}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: 'Chave PIX', value: semiAutoPix != 'none' ? `\`${semiAutoPix} | ${semiAutoPixType}\`` : '`Não configurado.`', inline: true },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: 'QR Code', value: semiAutoQRCode != 'none' ? `[Link do QR Code](${semiAutoQRCode})` : '`Não configurado.`', inline: true }
        )
        .setColor(colorC !== "none" ? colorC : "#460580")
        .setFooter({ text: `Configure usando os botões abaixo.` })

    return {
        embeds: [embedPaymentsSemiAuto],
        components: [rowPaymentsSemiAuto, rowPaymentsSemiAuto2]
    }

}

function toggleSemiAuto(client, interaction) {
    const semiAutoPayment = dbConfigs.get(`vendas.payments.paymentsOptions.semiAuto`)
    semiAutoPayment !== false ? dbConfigs.set(`vendas.payments.paymentsOptions.semiAuto`, false) : dbConfigs.set(`vendas.payments.paymentsOptions.semiAuto`, true)
}

async function changePixModal(client, interaction) {
    const modal = new ModalBuilder()
        .setCustomId(`modalPix`)
        .setTitle(`🔑 | Chave PIX`)

    const inputPixKey = new TextInputBuilder()
        .setCustomId('pixKeyText')
        .setLabel(`Chave PIX:`)
        .setMaxLength(50)
        .setPlaceholder(`EX: nevermissapps@gmail.com`)
        .setRequired(true)
        .setStyle(`Paragraph`)

    const inputPixKeyType = new TextInputBuilder()
        .setCustomId('pixKeyTypeText')
        .setLabel(`Tipo de Chave PIX:`)
        .setMaxLength(15)
        .setPlaceholder(`EX: Email, Telefone, CPF, Aleatória ...`)
        .setRequired(true)
        .setStyle(`Short`)

    const iPixKey = new ActionRowBuilder()
        .addComponents(inputPixKey)

    const iPixKeyType = new ActionRowBuilder()
        .addComponents(inputPixKeyType)

    modal.addComponents(iPixKey, iPixKeyType)
    await interaction.showModal(modal)

}

async function changeQrCodeModal(client, interaction) {
    const modal = new ModalBuilder()
        .setCustomId(`modalQrCode`)
        .setTitle(`🖐 | QR Code`)

    const inputQrCode = new TextInputBuilder()
        .setCustomId('qrCodeText')
        .setLabel(`Link da Imagem: (QR Code)`)
        .setMaxLength(300)
        .setPlaceholder(`Digite "remover" para remover o atual ...`)
        .setRequired(true)
        .setStyle(`Paragraph`)

    const iQrCodeLink = new ActionRowBuilder()
        .addComponents(inputQrCode)

    modal.addComponents(iQrCodeLink)
    await interaction.showModal(modal)
}


async function configChannelsMain(client, interaction) {

    const colorC = await dbConfigs.get(`vendas.embeds.color`)
    const mensagem = `<:mensagem:${await dbe.get('mensagem')}>`;
    const carrinhoEmoji = `<:carrinho:${await dbe.get('carrinho')}>`;
    const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;
    const suporte = `<:suporte:${await dbe.get('suporte')}>`;
    const user = `<:user:${await dbe.get('user')}>`;
    const cadeadoEmoji = `<:cadeado:${await dbe.get('cadeado')}>`;


    const rowChannelsConfig = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`changeLogsPriv`).setLabel(`Logs Privadas`).setEmoji(`${cadeadoEmoji}`).setStyle(2),
            new ButtonBuilder().setCustomId(`changeLogsPublic`).setLabel(`Logs Públicas`).setEmoji(`${mensagem}`).setStyle(2),
            new ButtonBuilder().setCustomId(`changeCategoryCart`).setLabel(`Categoria de Carrinhos`).setEmoji(`${carrinhoEmoji}`).setStyle(2),
        )
    const rowChannelsConfig2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`changeRoleCustomer`).setLabel(`Cargo Cliente`).setEmoji(`${user}`).setStyle(2),
            new ButtonBuilder().setCustomId(`changeRoleStaff`).setLabel(`Cargo Aprovar Carrinho`).setEmoji(`${suporte}`).setStyle(2),
            new ButtonBuilder().setCustomId(`changeLogsavaliar`).setLabel(`Canal de Avaliar`).setEmoji(`${suporte}`).setStyle(2),
            new ButtonBuilder().setCustomId(`previousPaymentMethods`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(1)
        )

    const channelLogsPriv = await dbConfigs.get(`vendas.channels.channelLogsPrivId`)
    const channelLogsPublic = await dbConfigs.get(`vendas.channels.channelLogsPublicId`)
    const channelLogsavaliar = await dbConfigs.get(`vendas.channels.avaliar`)
    const categoryCart = await dbConfigs.get(`vendas.channels.categoryCartsId`)
    const roleCustomer = await dbConfigs.get(`vendas.roles.roleCustomerId`)
    const roleStaffer = await dbConfigs.get(`vendas.roles.roleStaffID`)

    const channelLogsPrivFormatted = channelLogsPriv != "none" ? interaction.guild.channels.cache.get(channelLogsPriv) || `\`não setado.\`` : `\`Não configurado.\``;
    const channelLogsPublicFormatted = channelLogsPublic != "none" ? interaction.guild.channels.cache.get(channelLogsPublic) || `\`não setado.\`` : `\`Não configurado.\``;
    const categoryCartFormatted = categoryCart != "none" ? interaction.guild.channels.cache.get(categoryCart) || `\`não setado.\`` : `\`Não configurado.\``;
    const roleCustomerFormatted = roleCustomer != "none" ? interaction.guild.roles.cache.get(roleCustomer) || `\`não setado.\`` : `\`Não configurado.\``;
    const roleStafferFormatted = roleStaffer != "none" ? interaction.guild.roles.cache.get(roleStaffer) || `\`não setado.\`` : `\`Não configurado.\``;
    const channelavaliarFormatted = channelLogsavaliar != "none" ? interaction.guild.channels.cache.get(channelLogsavaliar) || `\`Náo Definido.\`` : `\`Não configurado.\``;

    const embedChannelsConfig = new EmbedBuilder()
        .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
        .setTitle(`${client.user.username} | Configurações`)
        .addFields(
            { name: 'Canal de Logs Privadas', value: `${channelLogsPrivFormatted}`, inline: true },
            { name: 'Canal de Logs Públicas', value: `${channelLogsPublicFormatted}`, inline: true },
            { name: 'Categoria de Carrinhos', value: `${categoryCartFormatted}`, inline: true },
            { name: 'Cargo de Cliente', value: `${roleCustomerFormatted}`, inline: true },
            { name: 'Cargo Aprovar Carrinho', value: `${roleStafferFormatted}`, inline: true },
            { name: 'Canal de Avaliar', value: `${channelavaliarFormatted}`, inline: true },
        )
        .setColor(colorC !== "none" ? colorC : "#460580")
        .setFooter({ text: `Configure usando os botões abaixo.` })

    return {
        embeds: [embedChannelsConfig],
        components: [rowChannelsConfig, rowChannelsConfig2]
    }
}

async function SelectChannelSet(client, interaction) {

    const colorC = await dbConfigs.get(`vendas.embeds.color`)
    const lixoEmoji = `<:lixo:${await dbe.get('lixo')}>`;
    const voltarEmoji = `<:voltar:${await dbe.get('voltar')}>`;
    const config = `<:config:${await dbe.get('config')}>`;


    let name
    let type
    if (interaction.customId == 'changeLogsPriv') {
        name = 'channelLogsPrivId'
        type = 'Canal'
    } else if (interaction.customId == 'changeLogsPublic') {
        name = 'channelLogsPublicId'
        type = 'Canal'
    } else if (interaction.customId == 'changeCategoryCart') {
        name = 'categoryCartsId'
        type = 'Categoria'
    } else if (interaction.customId == 'changeRoleCustomer') {
        name = 'roleCustomerId'
        type = 'Cargo'
    } else if (interaction.customId == 'changeRoleStaff') {
        name = 'roleStaffID'
        type = 'Cargo'
    } else if (interaction.customId == 'changeLogsavaliar') {
        name = 'avaliar'
        type = 'Canal'
    }

    let rowRoles1;

    if (type == 'Canal') {
        rowRoles1 = new ActionRowBuilder()
            .addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId(`setChannel_${name}_${type}`)
                    .setPlaceholder(`Selecione um canal ...`)
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addChannelTypes(ChannelType.GuildText)
            );
    } else if (type == 'Categoria') {
        rowRoles1 = new ActionRowBuilder()
            .addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId(`setChannel_${name}_${type}`)
                    .setPlaceholder(`Selecione uma categoria ...`)
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addChannelTypes(ChannelType.GuildCategory)
            );
    } else if (type == 'Cargo') {
        rowRoles1 = new ActionRowBuilder()
            .addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(`setChannel_${name}_${type}`)
                    .setPlaceholder(`Selecione um cargo ...`)
                    .setMinValues(1)
                    .setMaxValues(1)
            );
    }



    const rowRoles2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`resetperm_${name}_${type}`).setLabel(`Remover ${type}`).setEmoji(`${lixoEmoji}`).setStyle(`Danger`),
            new ButtonBuilder().setCustomId(`configChannels`).setEmoji(`<:voltar:1365849508059287633>`).setStyle(`Secondary`)
        )

    const embedRoles = new EmbedBuilder()
        .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
        .setTitle(`${client.user.username} | Cargos`)
        .setDescription(`**${config} | Selecione o(um) ${type} para o(s) ${name}**`)
        .setColor(colorC !== "none" ? colorC : "#460580")

    return {
        embeds: [embedRoles],
        components: [rowRoles1, rowRoles2]
    }

}

function toggleNewSales(client, interaction) {
    const statusNewSales = dbConfigs.get(`vendas.newSales`)
    statusNewSales !== false ? dbConfigs.set(`vendas.newSales`, false) : dbConfigs.set(`vendas.newSales`, true)

}

async function changeTerms(client, interaction) {
    const modal = new ModalBuilder()
        .setCustomId(`modalTerms`)
        .setTitle(`📚 | Termos`)

    const inputNewTerms = new TextInputBuilder()
        .setCustomId('newTermsText')
        .setLabel(`Novos Termos:`)
        .setMaxLength(1800)
        .setPlaceholder(`Insira o novos termos de compra ...`)
        .setRequired(true)
        .setStyle(`Paragraph`)

    const iNewTerms = new ActionRowBuilder()
        .addComponents(inputNewTerms)

    modal.addComponents(iNewTerms)
    await interaction.showModal(modal)
}

function buttonDuvidas(client, interaction) {

    const modal = new ModalBuilder()
        .setCustomId('modalDuvidas')
        .setTitle('🔗 | Duvidas')

    const inputNewButtonDuvidas = new TextInputBuilder()
        .setCustomId('newButtonDuvidasText')
        .setLabel('Canal Duvidas:')
        .setMaxLength(75)
        .setPlaceholder('Insira o id do canal para o botão de dúvidas...\n"remover" para remover')
        .setRequired(true)
        .setStyle('Paragraph')

    const iNewButtonDuvidas = new ActionRowBuilder()
        .addComponents(inputNewButtonDuvidas)

    modal.addComponents(iNewButtonDuvidas)
    interaction.showModal(modal)

}

module.exports = {
    ConfigPayments,
    PainelVendasMain,
    mpMethod,
    togglePixMP,
    ModalMP,
    SaldoPayment,
    toggleBalance,
    depositBonus,
    minimumDeposit,
    semiAutoMethod,
    toggleSemiAuto,
    changePixModal,
    changeQrCodeModal,
    configChannelsMain,
    SelectChannelSet,
    toggleNewSales,
    changeTerms,
    buttonDuvidas
}