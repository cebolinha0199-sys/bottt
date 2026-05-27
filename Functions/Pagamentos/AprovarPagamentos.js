const { Payment, default: MercadoPagoConfig } = require("mercadopago");
const { JsonDatabase } = require("wio.db");
const { createCobEfi, generateQRCode, ReembolsoEfi } = require("./EfiBank.js");
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, WebhookClient, AttachmentBuilder } = require("discord.js");
const { default: axios } = require("axios");
const { createPaymentLinkWithSecretKey } = require("./Stripe");
const { getCache } = require("../connect_api");
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });
const dbOpenedCarts = new JsonDatabase({ databasePath: "./databases/dbOpenedCarts.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbProfiles = new JsonDatabase({ databasePath: "./databases/dbProfiles.json" });
const dbb = new JsonDatabase({ databasePath: "./databases/PagamentosNu.json" });

async function CreatePayments(client, channelId, type, interaction, idc) {
    let payment = await dbOpenedCarts.get(channelId)

    let totalPrice = 0
    const productIds = Object.keys(payment.products)
    let cupomexist = await dbOpenedCarts.get(`${channelId}.purchaseCoupon.couponDiscount`)
    const colorC = await dbConfigs.get(`vendas.embeds.color`)
    let allProductsNames = [];
    let logmessage5 = ``
    let logmessage6 = ``
    let qtdprodutos = 0
    let idPaymento
    for (const pId of productIds) {
        let productDetails = await payment.products[pId];
        const purchaseAmount = productDetails.purchaseAmount;
        const productName = productDetails.productName;
        totalPrice += Number(productDetails.productPrice) * Number(productDetails.purchaseAmount);
        qtdprodutos += purchaseAmount

        const formattedProductName = `${productName} x${purchaseAmount}`;
        const valorProduto = Number(productDetails.productPrice) * Number(productDetails.purchaseAmount)
        logmessage5 += `\`${purchaseAmount}x ${productName} | ${Number(productDetails.productPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n`
        logmessage6 += `\`${Number(valorProduto).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\` - \`${productName} (${purchaseAmount} unidade)\`\n`

        allProductsNames.push(formattedProductName);
    }

    let cupomDiscount = cupomexist == "none" ? 0 : cupomexist
    let totalDiscount = totalPrice * (cupomDiscount / 100)
    totalPrice = totalPrice - totalDiscount
    if (totalPrice < 0) totalPrice = 0
    if (totalPrice < 0.01) totalPrice = 0.01
    let user = interaction.user
    if (idc) user = await client.users.fetch(idc).catch(() => { })

    // update totalPrice in dbOpenedCarts
    // await dbOpenedCarts.set(`${channelId}.totalPrice`, totalPrice)


    const dinheiroEmoji = `<:dinheiro:${await dbe.get('dinheiro')}>`;
    const docEmoji = `<:doc:${await dbe.get('doc')}>`;

    if (type == 'saldo') {
        let saldo = await dbProfiles.get(`${user.id}.balance`)
        if (saldo < totalPrice) {
            return interaction.reply({ content: `Você não possui saldo suficiente para realizar essa compra!`, ephemeral: true })
        }

        let restante = saldo - totalPrice

        let rowssimenao = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`saldoConfirmSim`).setLabel(`Sim`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`saldoConfirmNao`).setLabel(`Não`).setStyle(`Danger`)
            )


        interaction.update({ components: [rowssimenao], embeds: [], content: `- Você realmente deseja adquirir este produto que custa \`${Number(totalPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\` com saldo?\n\n- Seu saldo após a compra será \`${Number(restante).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`` })

    }



    if (type === 'SemiAutomatic' || type === 'saldo2') {



        if (type === 'saldo2') {
            let saldo = await dbProfiles.get(`${user.id}.balance`)
            if (saldo < totalPrice) {
                return interaction.reply({ content: `Você não possui saldo suficiente para realizar essa compra!`, ephemeral: true })
            }

            let restante = saldo - totalPrice
            await dbProfiles.set(`${user.id}.balance`, restante)
        }

        let dataPaymentId = Math.floor(10000000 + Math.random() * 90000000)
        let guild = await client.guilds.fetch(interaction.guild.id)

        const embed2 = new EmbedBuilder()
            .setAuthor({ name: `Pedido solicitado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562913790595133.webp?size=44&quality=lossless' })
            .setColor('Yellow')
            .setDescription(`Usuário <@!${user.id}> solicitou um pedido.`)
            .setFields(
                { name: `Detalhes:`, value: logmessage5 },
                { name: `ID do Pedido`, value: `\`${dataPaymentId}\`` },
                { name: `Forma de Pagamento`, value: `\`${type == 'SemiAutomatic' ? `Semi Automatico` : type == 'saldo2' ? `Saldo` : type}\`` }
            )
            .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) })
            .setTimestamp()

        try {
            const channelLog = await client.channels.fetch(await dbConfigs.get(`vendas.channels.channelLogsPrivId`))
            let msgidLog = await channelLog.send({ embeds: [embed2] })
            await dbOpenedCarts.set(`${channelId}.log`, { channel: channelLog.id, message: msgidLog.id })
        } catch (error) {
        }





        await dbOpenedCarts.set(`${channelId}.paymentId`, dataPaymentId)
        let channel = await client.channels.fetch(channelId)
        await channel.bulkDelete(100)
        //channel.send({ content: `🎉 | Pagamento Aprovado!\n${docEmoji} ID da compra: **${dataPaymentId}**` })

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Pedido aprovado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562861584224288.webp?size=44&quality=lossless' })
            .setColor('Green')
            .setDescription(`Usuário <@!${user.id}> teve seu pedido aprovado`)
            .setFields(
                { name: `Detalhes`, value: logmessage5, inline: false },
                { name: `ID do Pedido`, value: `\`${dataPaymentId}\``, inline: false },)
            .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
            .setTimestamp()

        const row222 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ReembolsarCompra-' + dataPaymentId)
                    .setLabel('Reembolsar')
                    .setEmoji('1243421135673229362')
                    .setDisabled(false)
                    .setStyle(2)
            );

        try {
            let infocart = await dbOpenedCarts.get(channelId)
            let channel = await client.channels.fetch(infocart.log.channel)
            let message = await channel.messages.fetch(infocart.log.message)
            let msgnew = await message.reply({ embeds: [embed], components: [row222] })
            await dbOpenedCarts.set(`${channelId}.log.message`, msgnew.id)
        } catch (error) {
        }

        await dbOpenedCarts.set(`${channelId}.status`, 'approved')
        await dbOpenedCarts.set(`${channelId}.paymentType`, type)
        await dbOpenedCarts.set(`${channelId}.paymentID`, dataPaymentId)



        let data = JSON.stringify({
            "user_id": `${user.id}`,
            "price": totalPrice,
            "paymentId": `${dataPaymentId}`,
            "typeBank": `${type}`,
            "QtdProdutos": qtdprodutos,
            "guild_id": `${interaction.guild.id}`,
            "date": `${Date.now()}`
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://nevermiss-api.squareweb.app/estatisticas',
            headers: {
                'Authorization': 'wj5O7E82dG4t',
                'Content-Type': 'application/json'
            },
            data: data
        };

        await axios.request(config)


    } else if (type === 'mercadoPago') {

        // Verificar se totalPrice existe e é válido
        if (!totalPrice) {
            throw new Error('Total price is required');
        }

        // Garantir que seja um número válido com 2 casas decimais
        const amount = Number(parseFloat(String(totalPrice)).toFixed(2));

        // Validar se o valor é positivo e não-zero
        if (isNaN(amount) || amount <= 0) {
            throw new Error(`Invalid transaction amount: ${totalPrice}`);
        }


        const tokenMp = await dbConfigs.get(`vendas.payments.mpAcessToken`);
        const mpClient = new MercadoPagoConfig({ accessToken: tokenMp });

        const mpPayment = new Payment(mpClient);

        const paymentData = {
            transaction_amount: amount,
            description: `Compras - ${user.username}`,
            payment_method_id: 'pix',
            payer: {
                email: 'abner@gmail.com',
            },
        };

        idPaymento = await mpPayment.create({ body: paymentData })

        await dbOpenedCarts.set(`${channelId}.paymentID`, idPaymento.id)
        await dbOpenedCarts.set(`${channelId}.CopiaECola`, idPaymento.point_of_interaction.transaction_data.qr_code)
        await dbOpenedCarts.set(`${channelId}.Qrcode`, idPaymento.point_of_interaction.transaction_data.qr_code_base64)

        await dbOpenedCarts.set(`${channelId}.status`, 'pending')
        await dbOpenedCarts.set(`${channelId}.paymentType`, type)

        idPaymento = idPaymento.id

    } else if (type === 'efiBank') {

        let payment = await createCobEfi(totalPrice, `Compras - ${user.username}`, user.username, client)
        let qrcode = await generateQRCode(payment.loc.id, client)
        const base64Image = qrcode.imagemQrcode.split(",")[1];
        await dbOpenedCarts.set(`${channelId}.paymentID`, payment.txid)
        await dbOpenedCarts.set(`${channelId}.CopiaECola`, qrcode.qrcode)
        await dbOpenedCarts.set(`${channelId}.Qrcode`, base64Image)
        idPaymento = payment.txid

        await dbOpenedCarts.set(`${channelId}.status`, 'pending')
        await dbOpenedCarts.set(`${channelId}.paymentType`, type)
    } else if (type === 'stripe') {

        if (Number(totalPrice) < 0.50) return interaction.reply({ content: `O valor mínimo para pagamentos via Stripe é de R$ 0,50`, ephemeral: true })

        let chaveacessStripe = await dbConfigs.get(`vendas.payments.StripeKeys`)
        if (!chaveacessStripe) return interaction.reply({ content: `Chave de acesso do Stripe não encontrada`, ephemeral: true })
        let payment = await createPaymentLinkWithSecretKey(chaveacessStripe, totalPrice, `Compras - ${user.username}`)
        if (payment.error) return interaction.reply({ content: `Erro ao criar o pagamento: ${payment.message}`, ephemeral: true })
        await dbOpenedCarts.set(`${channelId}.paymentID`, payment.id)
        await dbOpenedCarts.set(`${channelId}.LinkURL`, payment.url)
        await dbOpenedCarts.set(`${channelId}.status`, 'pending')
        await dbOpenedCarts.set(`${channelId}.paymentType`, type)


        const embedPixPayment = new EmbedBuilder()
            .setTitle(`Confirmação de Compra`)
            .setDescription(`> Verifique se os produtos estão corretos e escolha o método de pagamento desejado.\n`)
            .addFields(
                { name: `Produtos`, value: `${logmessage6}`, inline: false },
                { name: `Valor total`, value: `\`${Number(totalPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                { name: `Desconto`, value: `\`${Number(totalDiscount).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
            )
            .setColor(colorC !== "none" ? colorC : "#460580")

        const rowPixPayment = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setURL(`${payment.url}`).setLabel(`Realizar Pagamento`).setEmoji(`<:card:1356704259432910988>`).setStyle(5),
                new ButtonBuilder().setCustomId(`cancelPayment`).setEmoji(`<a:incorreto:1235790401219067975>`).setStyle(`Danger`)
            );

        interaction.update({ embeds: [embedPixPayment], components: [rowPixPayment] });



        const embed2 = new EmbedBuilder()
            .setAuthor({ name: `Pedido solicitado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562913790595133.webp?size=44&quality=lossless' })
            .setColor('Yellow')
            .setDescription(`Usuário <@!${user.id}> solicitou um pedido.`)
            .setFields(
                { name: `Detalhes:`, value: logmessage5 },
                { name: `ID do Pedido`, value: `\`${payment.id}\`` },
                { name: `Forma de Pagamento`, value: `\`${type == 'efiBank' ? `Efi Bank` : type == 'mercadoPago' ? `Mercado Pago` : type}\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp()

        try {
            const channelLog = await client.channels.fetch(await dbConfigs.get(`vendas.channels.channelLogsPrivId`))
            let msgidLog = await channelLog.send({ embeds: [embed2] })
            await dbOpenedCarts.set(`${channelId}.log`, { channel: channelLog.id, message: msgidLog.id })
        } catch (error) {
        }

    } else if (type === 'esales') {
        let taxaoperacional = 0
        if (Number(totalPrice) < 5) {
            taxaoperacional = 0.06
        }
        let porcentagemVendedor = totalPrice * 0.10

        // console.log(`Taxa operacional: ${taxaoperacional}`)
        // console.log(`Porcentagem do vendedor: ${porcentagemVendedor}`)
        // console.log(`Total Price: ${totalPrice}`)

        totalPrice = totalPrice + taxaoperacional

        totalPrice = Number(totalPrice).toFixed(2)

        let logmessage7 = logmessage6.replace(/`/g, '')

        let infopg = await axios.post("https://api.e-sales.company/e-sales/payment", {
            value: totalPrice,
            desc: logmessage7,
            name: `${interaction.user.username} (${interaction.user.id})`,
        }, {
            headers: {
                "Authorization": "esalesAPiSquare",
                "Content-Type": "application/json"
            }
        }).catch(async (err) => {
            console.log(err)
        })


        infopg = infopg.data
        const base64Image = infopg.qrcode.imagemQrcode.split(",")[1];
        await dbOpenedCarts.set(`${channelId}.paymentID`, infopg.resultPayment.txid)
        await dbOpenedCarts.set(`${channelId}.CopiaECola`, infopg.qrcode.qrcode)
        await dbOpenedCarts.set(`${channelId}.Qrcode`, base64Image)
        await dbOpenedCarts.set(`${channelId}.status`, 'pending')
        await dbOpenedCarts.set(`${channelId}.paymentType`, type)


        let valorvend = Number(porcentagemVendedor).toFixed(2)
        let totalP2 = Number(totalPrice).toFixed(2)
        let totalP = totalP2 - taxaoperacional
        await dbOpenedCarts.set(`${channelId}.taxas`,
            {
                porcentagemVendedor: Number(valorvend),
                taxaoperacional: taxaoperacional,
                totalPrice: Number(totalP),
            }
        )


        const embedPixPayment = new EmbedBuilder()
            .setTitle(`Confirmação de Compra`)
            .setDescription(`> Verifique se os produtos estão corretos e escolha o método de pagamento desejado.\n`)
            .addFields(
                { name: `Produtos`, value: `${logmessage6}`, inline: false },
                { name: `Valor total`, value: `\`${Number(totalPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                { name: `Desconto`, value: `\`${Number(totalDiscount).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
            )
            .setColor(colorC !== "none" ? colorC : "#460580")

        if (taxaoperacional > 0) {
            embedPixPayment.setFooter({ text: `Taxa operacional de ${Number(taxaoperacional).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })} do sistema e-sales, Caso sua compra for abaixo de R$ 5.00` })
        }

        const rowPixPayment = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`copiaCola`).setLabel(`Pix Copia e Cola`).setEmoji(`<:1289360523074207807:1289647527515127961>`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`qrCode2`).setLabel(`QR Code`).setEmoji(`<:QRCODE:1328739559026065530>`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`TermosEsales`).setEmoji(`<:1289381400801316966:1289647562520924241>`).setStyle(2).setLabel(`Termos e Condições`),
            );


        interaction.update({ embeds: [embedPixPayment], components: [rowPixPayment], ephemeral: true })

        const embed2 = new EmbedBuilder()
            .setAuthor({ name: `Pedido solicitado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562913790595133.webp?size=44&quality=lossless' })
            .setColor('Yellow')
            .setDescription(`Usuário <@!${user.id}> solicitou um pedido.`)
            .setFields(
                { name: `Detalhes:`, value: logmessage5 },
                { name: `ID do Pedido`, value: `\`${infopg.resultPayment.txid}\`` },
                { name: `Forma de Pagamento`, value: `\`e-Sales\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp()

        try {
            const channelLog = await client.channels.fetch(await dbConfigs.get(`vendas.channels.channelLogsPrivId`))
            let msgidLog = await channelLog.send({ embeds: [embed2] })
            await dbOpenedCarts.set(`${channelId}.log`, { channel: channelLog.id, message: msgidLog.id })
        } catch (error) {

        }
    } else if (type === 'nubank') {

        let pagamentos = dbOpenedCarts.fetchAll()
        let valoresUtilizados = pagamentos.map(p => Number(p?.data?.priceID?.price || null));
        let valorcart = Number(totalPrice).toFixed(2);
        valorcart = Number(valorcart)
        let taxaNubank = { status: false, value: 0 }

        const arredondar = (valor) => Math.round(valor * 100) / 100;

        while (valoresUtilizados.includes(arredondar(valorcart))) {
            valorcart = arredondar(valorcart + 0.01);
        }


        if (totalPrice != valorcart) {
            taxaNubank.status = true;
            taxaNubank.value = valorcart - totalPrice
        }

        const GenerateID = GenerateKeyRandom(11);

        await dbOpenedCarts.set(`${channelId}.priceID`, {
            price: valorcart,
            taxaNubank: taxaNubank,
            id: GenerateID,
            dateCreated: Date.now(),
        }
        )

        const nomeRecebedor = 'ManualPix';
        const cidadeRecebedor = 'Sao Paulo';
        const QRCode = require('qrcode');

        const payloadPix = gerarPayloadPix(await dbConfigs.get(`vendas.payments.NubankEmail`), Number(valorcart), nomeRecebedor, cidadeRecebedor, GenerateID);
 


        const buffer = await QRCode.toBuffer(payloadPix, {
            type: 'png',
            width: 300,
            errorCorrectionLevel: 'H'
        });
        await dbOpenedCarts.set(`${channelId}.status`, 'pending')
        await dbOpenedCarts.set(`${channelId}.paymentType`, type)
        await dbOpenedCarts.set(`${channelId}.paymentID`, GenerateID)

        let ImageBuffer = new AttachmentBuilder(buffer, { name: 'qrcode.png' });

        await dbOpenedCarts.set(`${channelId}.CopiaECola`, payloadPix)


        const datenow10minutes = Date.now() + 600000;
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
        const embedPixPayment = new EmbedBuilder()
            .setTitle(`Confirmação de Compra`)
            .setDescription(`> Verifique se os produtos estão corretos e escolha o método de pagamento desejado.\n`)
            .addFields(
                { name: `Produtos`, value: `${logmessage6}`, inline: false },
                { name: `Valor total`, value: `\`${Number(valorcart).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`${taxaNubank.status ? ` (Adicionado \`R$ ${Number(taxaNubank.value).toFixed(2)}\` taxa nubank)` : ``}`, inline: true },
            )
            .setColor(colorC !== "none" ? colorC : "#460580")
            .setImage(`attachment://qrcode.png`)


        const rowPixPayment = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`copiaCola`).setLabel(`Pix Copia e Cola`).setEmoji(`<:1289360523074207807:1289647527515127961>`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`cancelPayment`).setEmoji(`<:1289361576486240327:1289647775176331376>`).setStyle(`Danger`)
            );

        await interaction.update({ embeds: [embedPixPayment], components: [rowPixPayment], files: [ImageBuffer] });
        interaction.followUp({ content: `> Aguarde o pagamento ser confirmado, o prazo máximo para confirmação é de 5 minutos. Após o envio do pagamento no dados acima.`, ephemeral: false })

        const embed2 = new EmbedBuilder()
            .setAuthor({ name: `Pedido solicitado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562913790595133.webp?size=44&quality=lossless' })
            .setColor('Yellow')
            .setDescription(`Usuário <@!${user.id}> solicitou um pedido.`)
            .setFields(
                { name: `Detalhes:`, value: logmessage5 },
                { name: `ID do Pedido`, value: `\`${GenerateID}\`` },
                { name: `Forma de Pagamento`, value: `\`Nubank & Picpay\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp()

        try {
            const channelLog = await client.channels.fetch(await dbConfigs.get(`vendas.channels.channelLogsPrivId`))
            let msgidLog = await channelLog.send({ embeds: [embed2] })
            await dbOpenedCarts.set(`${channelId}.log`, { channel: channelLog.id, message: msgidLog.id })
        } catch (error) {

        }

        // mude na banco de dados o valor do pagamento



    }

    if (type === 'efiBank' || type === 'mercadoPago') {
        const datenow10minutes = Date.now() + 600000;
        const expirationTenMinutes = `<t:${Math.floor(datenow10minutes / 1000)}:f> (<t:${Math.floor(datenow10minutes / 1000)}:R>)`;
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
        const embedPixPayment = new EmbedBuilder()
            .setTitle(`Confirmação de Compra`)
            .setDescription(`> Verifique se os produtos estão corretos e escolha o método de pagamento desejado.\n`)
            .addFields(
                { name: `Produtos`, value: `${logmessage6}`, inline: false },
                { name: `Valor total`, value: `\`${Number(totalPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                { name: `Desconto`, value: `\`${Number(totalDiscount).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
            )
            .setColor(colorC !== "none" ? colorC : "#460580")

        const rowPixPayment = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`copiaCola`).setLabel(`Pix Copia e Cola`).setEmoji(`<:1289360523074207807:1289647527515127961>`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`qrCode2`).setLabel(`QR Code`).setEmoji(`<:QRCODE:1328739559026065530>`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`cancelPayment`).setEmoji(`<:1289361576486240327:1289647775176331376>`).setStyle(`Danger`)
            );

        interaction.update({ embeds: [embedPixPayment], components: [rowPixPayment] });



        const embed2 = new EmbedBuilder()
            .setAuthor({ name: `Pedido solicitado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562913790595133.webp?size=44&quality=lossless' })
            .setColor('Yellow')
            .setDescription(`Usuário <@!${user.id}> solicitou um pedido.`)
            .setFields(
                { name: `Detalhes:`, value: logmessage5 },
                { name: `ID do Pedido`, value: `\`${idPaymento}\`` },
                { name: `Forma de Pagamento`, value: `\`${type == 'efiBank' ? `Efi Bank` : type == 'mercadoPago' ? `Mercado Pago` : type}\`` }
            )
            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp()

        try {
            const channelLog = await client.channels.fetch(await dbConfigs.get(`vendas.channels.channelLogsPrivId`))
            let msgidLog = await channelLog.send({ embeds: [embed2] })
            await dbOpenedCarts.set(`${channelId}.log`, { channel: channelLog.id, message: msgidLog.id })
        } catch (error) {
            //  console.log(error)
        }



    }
}

let andament = false
async function VerificarPagamento(client) {
    if (andament) return;
    const docEmoji = `<:doc:${await dbe.get('doc')}>`;




    let AllPagamentosPending = dbOpenedCarts.all().filter(pedido => pedido.data.status === 'pending');
    andament = true;


    for (let i = 0; i < AllPagamentosPending.length; i++) {
        let infocart = AllPagamentosPending[i].data
        let paymentId = infocart.paymentID
        let paymentType = infocart.paymentType
        let userID = infocart.userId
        let guildId = infocart.guildId
        let channelId = AllPagamentosPending[i].ID
        let guild, channel;
        try {
            guild = await client.guilds.fetch(guildId);
            channel = await client.channels.fetch(channelId);
        } catch (error) {
            console.error(`Erro ao buscar guild ou canal:`, error);
            await dbOpenedCarts.delete(channelId);
            continue
        }

        let payment = await dbOpenedCarts.get(channelId)
        const productIds = Object.keys(payment.products)
        let logmessage5 = ``
        let qtdprodutos = 0
        let totalPrice = 0
        for (const pId of productIds) {
            let productDetails = await payment.products[pId];
            const purchaseAmount = productDetails.purchaseAmount;
            const productName = productDetails.productName;
            totalPrice += Number(productDetails.productPrice) * Number(productDetails.purchaseAmount);
            qtdprodutos += purchaseAmount
            logmessage5 += `\`${purchaseAmount}x ${productName} | ${Number(productDetails.productPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n`
        }

        let cupomexist = await dbOpenedCarts.get(`${channelId}.purchaseCoupon.couponDiscount`)
        let cupomname = await dbOpenedCarts.get(`${channelId}.purchaseCoupon.couponId`)
        let cupomDiscount = cupomexist == "none" ? 0 : cupomexist
        let totalDiscount = totalPrice * (cupomDiscount / 100)
        totalPrice = totalPrice - totalDiscount
        if (totalPrice < 0) totalPrice = 0
        if (totalPrice < 0.01) totalPrice = 0.01



        const tokenMp = await dbConfigs.get(`vendas.payments.mpAcessToken`);
        if (paymentType == 'mercadoPago') {
            var res = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${tokenMp}`
                }
            })

            if (res.data.status == 'approved') {

                let bancosbloqueados = dbConfigs.get('vendas.payments.bankBlock') || []
                if (bancosbloqueados.length !== 0) {
                    if (bancosbloqueados.includes(res.data.point_of_interaction.transaction_data.bank_info.payer.long_name) == true) {


                        await channel.messages.fetch().then(async (messages) => {
                            try {
                                await channel.bulkDelete(messages)
                            } catch (error) {

                            }

                        })


                        const urlReembolso = `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`;
                        const headers = {
                            Authorization: `Bearer ${tokenMp}`,
                        };


                        const body = {
                            metadata: {
                                reason: 'Banco Bloqueado!',
                            },
                        };

                        await axios.post(urlReembolso, body, { headers }).then(async response => {

                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setAuthor({ name: `Pedido #${paymentId}` })
                                .setTitle(`Pedido não aprovado`)
                                .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${res.data.point_of_interaction.transaction_data.bank_info.payer.long_name}\`, seu dinheiro foi reembolsado, tente novamente usando outro banco.`)
                                .addFields(
                                    { name: `Detalhes`, value: `${logmessage5}` }
                                )

                            const embed2 = new EmbedBuilder()
                                .setColor('Red')
                                .setAuthor({ name: `Pedido #${paymentId}` })
                                .setTitle(`Anti Banco | Nova Venda`)
                                .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${res.data.point_of_interaction.transaction_data.bank_info.payer.long_name}\`, o dinheiro do Comprador foi reembolsado, Obrigado por confiar em meu trabalho.`).addFields(
                                    { name: `Detalhes`, value: `${logmessage5}` }
                                )

                            try {
                                let channel = await client.channels.fetch(infocart.log.channel)
                                let message = await channel.messages.fetch(infocart.log.message)
                                await message.reply({ embeds: [embed2], content: `<@${userID}>` })
                            } catch (error) {

                            }

                            const agora = Math.floor(new Date().getTime() / 1000);
                            const novoTimestamp = agora + 60;

                            channel.send({ content: `<@${userID}>, Este canal será excluido em <t:${novoTimestamp}:R>`, embeds: [embed] }).then(deletechannel => {
                                setInterval(async () => {
                                    try {
                                        await channel.delete()
                                    } catch (error) {

                                    }
                                }, 60000);
                            })


                        })
                            .catch(error => {

                                console.error('Erro ao emitir o reembolso:', error);
                            });
                        await dbOpenedCarts.delete(channelId)
                        continue;
                    }
                }










                await dbOpenedCarts.set(`${channelId}.status`, 'approved')
                await channel.bulkDelete(100)
                //channel.send({ content: `🎉 | Pagamento Aprovado!\n${docEmoji} ID da compra: **${paymentId}**` })

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Pedido aprovado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562861584224288.webp?size=44&quality=lossless' })
                    .setColor('Green')
                    .setDescription(`Usuário <@!${userID}> teve seu pedido aprovado`)
                    .setFields(
                        { name: `Detalhes`, value: logmessage5, inline: false },
                        { name: `ID do Pedido`, value: `\`${paymentId}\``, inline: false },
                        { name: `Banco`, value: `\`${res.data.point_of_interaction.transaction_data.bank_info.payer.long_name}\``, inline: false }
                    )
                    .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                    .setTimestamp()

                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ReembolsarCompra-' + paymentId)
                            .setLabel('Reembolsar')
                            .setEmoji('1243421135673229362')
                            .setDisabled(false)
                            .setStyle(2)
                    );

                try {
                    let channel = await client.channels.fetch(infocart.log.channel)
                    let message = await channel.messages.fetch(infocart.log.message)
                    let msgnew = await message.reply({ embeds: [embed], components: [row222] })
                    await dbOpenedCarts.set(`${channelId}.log.message`, msgnew.id)
                } catch (error) {
                    console.log(error)
                }

                let data = JSON.stringify({
                    "user_id": `${userID}`,
                    "price": totalPrice,
                    "paymentId": `${paymentId}`,
                    "typeBank": `${paymentType}`,
                    "QtdProdutos": qtdprodutos,
                    "guild_id": `${guildId}`,
                    "date": `${Date.now()}`
                });

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://nevermiss-api.squareweb.app/estatisticas',
                    headers: {
                        'Authorization': 'wj5O7E82dG4t',
                        'Content-Type': 'application/json'
                    },
                    data: data
                };

                await axios.request(config)


            }
        }


        if (paymentType == 'efiBank') {
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://promisseapi.squareweb.app/efibank/${paymentId}`,
                headers: {
                    'Authorization': 'wj5O7E82dG4t'
                }
            };

            let status
            try { status = await axios.request(config) } catch (error) { }
            if (status?.data?.status == 'approved') {
                const table = [
                    { banco: "Picpay Serviços S.A.", codigos: ["22896431", "09516419"] },
                    { banco: "Nu Pagamentos S.A.", codigos: ["18236120", "32219232"] },
                    { banco: "Banco Inter S.A.", codigos: ["00416968"] },
                    { banco: "Banco do Brasil S.A.", codigos: ["00000000"] },
                    { banco: "Ame Digital Brasil Ltda.", codigos: ["32778350"] },
                    { banco: "Cloud Walk Meios de Pagamentos e Serviços Ltda.", codigos: ["18189547"] },
                    { banco: "Banco Bradesco S.A.", codigos: ["60746948"] },
                    { banco: "Banco Itaucard S.A.", codigos: ["17192451"] },
                    { banco: "PagSeguro Internet S.A.", codigos: ["08561701"] },
                    { banco: "Banco BTG Pactual S.A.", codigos: ["30306294"] }
                ];

                let bancosbloqueados = dbConfigs.get('vendas.payments.bankBlock') || [];
                const bancoEncontrado = table.find(banco =>
                    banco.codigos.includes(status.data.bankinfo.gnExtras.pagador.codigoBanco)
                );

                if (bancoEncontrado && bancosbloqueados.includes(bancoEncontrado.banco)) {

                    await channel.messages.fetch().then(async (messages) => {
                        try {
                            await channel.bulkDelete(messages)
                        } catch (error) {

                        }

                    })

                    await ReembolsoEfi(paymentId, client)

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setAuthor({ name: `Pedido #${paymentId}` })
                        .setTitle(`Pedido não aprovado`)
                        .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${status.data.bankinfo.gnExtras.pagador.namebank}\`, seu dinheiro foi reembolsado, tente novamente usando outro banco.`)
                        .addFields(
                            { name: `Detalhes`, value: `${logmessage5}` }
                        )

                    const embed2 = new EmbedBuilder()
                        .setColor('Red')
                        .setAuthor({ name: `Pedido #${paymentId}` })
                        .setTitle(`Anti Banco | Nova Venda`)
                        .setDescription(`Esse servidor não está aceitando pagamentos desta instituição \`${status.data.bankinfo.gnExtras.pagador.namebank}\`, o dinheiro do Comprador foi reembolsado, Obrigado por confiar em meu trabalho.`).addFields(
                            { name: `Detalhes`, value: `${logmessage5}` }
                        )

                    try {
                        let channel = await client.channels.fetch(infocart.log.channel)
                        let message = await channel.messages.fetch(infocart.log.message)
                        message.reply({ embeds: [embed2], content: `<@${userID}>` })
                    } catch (error) {

                    }

                    const agora = Math.floor(new Date().getTime() / 1000);
                    const novoTimestamp = agora + 60;

                    channel.send({ content: `<@${userID}>, Este canal será excluido em <t:${novoTimestamp}:R>`, embeds: [embed] }).then(deletechannel => {
                        setInterval(async () => {
                            try {
                                await channel.delete()
                            } catch (error) {

                            }
                        }, 60000);
                    })
                    await dbOpenedCarts.delete(channelId)
                    continue;

                }






                await dbOpenedCarts.set(`${channelId}.status`, 'approved')
                await channel.bulkDelete(100)
                //channel.send({ content: `🎉 | Pagamento Aprovado!\n${docEmoji} ID da compra: **${paymentId}**` })

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Pedido aprovado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562861584224288.webp?size=44&quality=lossless' })
                    .setColor('Green')
                    .setDescription(`Usuário <@!${userID}> teve seu pedido aprovado`)
                    .setFields(
                        { name: `Detalhes`, value: logmessage5, inline: false },
                        { name: `ID do Pedido`, value: `\`${paymentId}\``, inline: false },
                        { name: `Banco`, value: `\`${status.data.bankinfo.gnExtras.pagador.namebank}\``, inline: false },
                        { name: `Nome do Comprador`, value: `\`${status.data.bankinfo.gnExtras.pagador.nome}\` (\`${status.data.bankinfo.gnExtras.pagador.cpf}\` )`, inline: false },
                    )
                    .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                    .setTimestamp()

                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ReembolsarCompra-' + paymentId)
                            .setLabel('Reembolsar')
                            .setDisabled(false)
                            .setEmoji('1243421135673229362')
                            .setStyle(2)
                    );

                try {
                    let channel = await client.channels.fetch(infocart.log.channel)
                    let message = await channel.messages.fetch(infocart.log.message)
                    let msgnew = await message.reply({ embeds: [embed], components: [row222] })
                    await dbOpenedCarts.set(`${channelId}.log.message`, msgnew.id)
                } catch (error) {
                    console.log(error)
                }


                let data = JSON.stringify({
                    "user_id": `${userID}`,
                    "price": totalPrice,
                    "paymentId": `${paymentId}`,
                    "typeBank": `${paymentType}`,
                    "QtdProdutos": qtdprodutos,
                    "guild_id": `${guildId}`,
                    "date": `${Date.now()}`
                });

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://nevermiss-api.squareweb.app/estatisticas',
                    headers: {
                        'Authorization': 'wj5O7E82dG4t',
                        'Content-Type': 'application/json'
                    },
                    data: data
                };

                axios.request(config)
            }
        }

        if (paymentType == 'stripe') {
            const config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://api.promisse.app/payment/status?txid=${paymentId}`,
                headers: {
                    'Authorization': 'nevermissapi'
                }
            };


            let status
            try { status = await axios.request(config) } catch (error) { }

            if (status?.data?.status?.status == true) {

                await dbOpenedCarts.set(`${channelId}.status`, 'approved')
                await channel.bulkDelete(100)
                //channel.send({ content: `🎉 | Pagamento Aprovado!\n${docEmoji} ID da compra: **${paymentId}**` })

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Pedido aprovado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562861584224288.webp?size=44&quality=lossless' })
                    .setColor('Green')
                    .setDescription(`Usuário <@!${userID}> teve seu pedido aprovado`)
                    .setFields(
                        { name: `Detalhes`, value: logmessage5, inline: false },
                        { name: `ID do Pedido`, value: `\`${paymentId}\``, inline: false },
                        { name: `Nome do Comprador`, value: `\`${status.data.status.name}\` (\`${status.data.status.email}\` )`, inline: false },
                    )
                    .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                    .setTimestamp()

                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ReembolsarCompra-' + paymentId)
                            .setLabel('Reembolsar')
                            .setDisabled(false)
                            .setEmoji('1243421135673229362')
                            .setStyle(2)
                    );

                try {
                    let channel = await client.channels.fetch(infocart.log.channel)
                    let message = await channel.messages.fetch(infocart.log.message)
                    let msgnew = await message.reply({ embeds: [embed], components: [row222] })
                    await dbOpenedCarts.set(`${channelId}.log.message`, msgnew.id)
                } catch (error) {
                }


                let data = JSON.stringify({
                    "user_id": `${userID}`,
                    "price": totalPrice,
                    "paymentId": `${paymentId}`,
                    "typeBank": `${paymentType}`,
                    "QtdProdutos": qtdprodutos,
                    "guild_id": `${guildId}`,
                    "date": `${Date.now()}`
                });

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://nevermiss-api.squareweb.app/estatisticas',
                    headers: {
                        'Authorization': 'wj5O7E82dG4t',
                        'Content-Type': 'application/json'
                    },
                    data: data
                };

                axios.request(config)
            }



        }

        if (paymentType == 'esales') {
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://promisseapi.squareweb.app/efibank/${paymentId}`,
                headers: {
                    'Authorization': 'wj5O7E82dG4t'
                }
            };

            let status
            try { status = await axios.request(config) } catch (error) { }
            if (status?.data?.status == 'approved') {
                let userSale = getCache(null, 'owner')
                userSale = await client.users.fetch(userSale)


                let products = []
                let productIds = Object.keys(payment.products)

                for (const pId of productIds) {
                    let productDetails = await payment.products[pId];
                    const purchaseAmount = productDetails.purchaseAmount;
                    const productName = productDetails.productName;
                    products.push({
                        id: pId,
                        name: productName,
                        price: Number(productDetails.productPrice),
                        qtd: purchaseAmount
                    })
                }
                let buyer = await client.users.fetch(userID)
                let IDPayment = paymentId
                let Taxas = infocart.taxas
                try {
                    await axios.post("https://api.e-sales.company/e-sales/buy", {
                        guildId,
                        userSale,
                        products,
                        buyer,
                        IDPayment,
                        Taxas,
                    }, {
                        headers: {
                            "Authorization": "esalesAPiSquare",
                            "Content-Type": "application/json"
                        }
                    })

                } catch (error) {

                }


                await dbOpenedCarts.set(`${channelId}.status`, 'approved')
                await channel.bulkDelete(100)
                //channel.send({ content: `🎉 | Pagamento Aprovado!\n${docEmoji} ID da compra: **${paymentId}**` })

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Pedido aprovado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562861584224288.webp?size=44&quality=lossless' })
                    .setColor('Green')
                    .setDescription(`Usuário <@!${userID}> teve seu pedido aprovado`)
                    .setFields(
                        { name: `Detalhes`, value: logmessage5, inline: false },
                        { name: `ID do Pedido`, value: `\`${paymentId}\``, inline: false },
                        { name: `Banco`, value: `\`${status.data.bankinfo.gnExtras.pagador.namebank}\``, inline: false },
                        { name: `Nome do Comprador`, value: `\`${status.data.bankinfo.gnExtras.pagador.nome}\` (\`${status.data.bankinfo.gnExtras.pagador.cpf}\` )`, inline: false },
                    )
                    .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                    .setTimestamp()

                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ReembolsarCompra-' + paymentId)
                            .setLabel('Reembolsar')
                            .setDisabled(true)
                            .setEmoji('1243421135673229362')
                            .setStyle(2)
                    );
                try {
                    let channel = await client.channels.fetch(infocart.log.channel)
                    let message = await channel.messages.fetch(infocart.log.message)
                    let msgnew = await message.reply({ embeds: [embed], components: [row222] })
                    await dbOpenedCarts.set(`${channelId}.log.message`, msgnew.id)
                } catch (error) {
                }

                let totaltaxas = infocart.taxas.taxaoperacional + infocart.taxas.porcentagemVendedor



                let data = JSON.stringify({
                    "user_id": `${userID}`,
                    "price": totalPrice,
                    "paymentId": `${paymentId}`,
                    "typeBank": `${paymentType}`,
                    "QtdProdutos": qtdprodutos,
                    "guild_id": `${guildId}`,
                    "date": `${Date.now()}`
                });

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://nevermiss-api.squareweb.app/estatisticas',
                    headers: {
                        'Authorization': 'wj5O7E82dG4t',
                        'Content-Type': 'application/json'
                    },
                    data: data
                };

                axios.request(config)

                let tcupom = Number(totalDiscount).toFixed(2)

                const embed2 = new EmbedBuilder()
                    .setColor('Green')
                    .setAuthor({ name: `Pedido #${paymentId}` })
                    .setTitle(`Pedido aprovado`)
                    .setDescription(`Usuário <@!${userID}> ${userID} teve seu pedido aprovado`)
                    .addFields(
                        { name: `Detalhes`, value: `${logmessage5}` },
                        { name: `ID do Pedido`, value: `\`${paymentId}\`` },
                        { name: `Banco`, value: `\`${status.data.bankinfo.gnExtras.pagador.namebank}\`` },
                        { name: `Valor do Pedido`, value: `\`${Number(totalPrice + infocart.taxas.taxaoperacional).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`` },
                        { name: `Taxa Operacional + Vendedor`, value: `\`${Number(totaltaxas).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`` },
                        { name: `Forma de Pagamento`, value: `\`${paymentType}\`` },
                        { name: `ID do Pagamento`, value: `\`${paymentId}\`` },
                        { name: `Servidor Infos`, value: `\`${guild.name}\` (\`${guildId}\`)` },
                        { name: `Vendedor Infos`, value: `\`${userSale.username}\` (\`${userSale.id}\`)` },
                        { name: `Cupom Infos (Name & Taxa)`, value: `\`${cupomname}\` (\`${Number(tcupom).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`)` },
                        { name: `Nome do Comprador`, value: `\`${status.data.bankinfo.gnExtras.pagador.nome}\` (\`${status.data.bankinfo.gnExtras.pagador.cpf}\` )` }
                    )
                    .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                    .setTimestamp()

                // envie a mensagem atraves de um webhook
                const webhook = new WebhookClient({ url: `https://discord.com/api/webhooks/1365378547748700220/k0rTR8lWRvFes0hrXDllPJtg-5jRZrWxxCHySFY6P-DJ44oR0qkwrv6yCWRmXLT3Ki0U` });
                await webhook.send({ embeds: [embed2] }).catch((err) => {
                    console.log(err)
                })




            }
        }

        if (paymentType == 'nubank') {
            let valor = Number(infocart.priceID.price).toFixed(2)
            let date = infocart.priceID.dateCreated
            let pagamentoscheck = dbb.fetchAll()
            let valoresFiltrados = pagamentoscheck.filter(p => {
                return Number(p.data.valor).toFixed(2) == Number(valor).toFixed(2) && p.data.used == false && p.data.data > date
            });
            if (valoresFiltrados.length > 0) {
                dbb.set(`${valoresFiltrados[0].ID}.used`, true)
                dbb.set(`${valoresFiltrados[0].ID}.dateUsed`, Date.now())


                await dbOpenedCarts.set(`${channelId}.status`, 'approved')
                await channel.bulkDelete(100)
                //channel.send({ content: `🎉 | Pagamento Aprovado!\n${docEmoji} ID da compra: **${paymentId}**` })

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Pedido aprovado`, iconURL: 'https://cdn.discordapp.com/emojis/1230562861584224288.webp?size=44&quality=lossless' })
                    .setColor('Green')
                    .setDescription(`Usuário <@!${userID}> teve seu pedido aprovado`)
                    .setFields(
                        { name: `Detalhes`, value: logmessage5, inline: false },
                        { name: `ID do Pedido`, value: `\`${paymentId}\``, inline: false },)
                    .setFooter({ text: `${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) ? guild.iconURL({ dynamic: true }) : null })
                    .setTimestamp()

                const row222 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ReembolsarCompra-' + paymentId)
                            .setLabel('Reembolsar')
                            .setDisabled(true)
                            .setEmoji('1243421135673229362')
                            .setStyle(2)
                    );

                try {
                    let channel = await client.channels.fetch(infocart.log.channel)
                    let message = await channel.messages.fetch(infocart.log.message)
                    let msgnew = await message.reply({ embeds: [embed], components: [row222] })
                    await dbOpenedCarts.set(`${channelId}.log.message`, msgnew.id)
                } catch (error) {
                }


                let data = JSON.stringify({
                    "user_id": `${userID}`,
                    "price": totalPrice,
                    "paymentId": `${paymentId}`,
                    "typeBank": `${paymentType}`,
                    "QtdProdutos": qtdprodutos,
                    "guild_id": `${guildId}`,
                    "date": `${Date.now()}`
                });

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://nevermiss-api.squareweb.app/estatisticas',
                    headers: {
                        'Authorization': 'wj5O7E82dG4t',
                        'Content-Type': 'application/json'
                    },
                    data: data
                };

                axios.request(config)
            }

        }

    }
    andament = false
}

module.exports = {
    CreatePayments,
    VerificarPagamento
}



function gerarPayloadPix(chave, valor, nomeRecebedor, cidadeRecebedor, identificadorTransacao = '') {
    function formatarCampo(id, valor) {
        return id + String(valor.length).padStart(2, '0') + valor;
    }

    const payloadFormatIndicator = formatarCampo('00', '01');
    const merchantAccountInfo = formatarCampo('26', formatarCampo('00', 'BR.GOV.BCB.PIX') + formatarCampo('01', chave)); // Chave PIX
    const merchantCategoryCode = formatarCampo('52', '0000');
    const transactionCurrency = formatarCampo('53', '986');
    const transactionAmount = valor ? formatarCampo('54', valor.toFixed(2)) : '';
    const countryCode = formatarCampo('58', 'BR');
    const merchantName = formatarCampo('59', nomeRecebedor.toUpperCase());
    const merchantCity = formatarCampo('60', cidadeRecebedor.toUpperCase());
    const additionalDataFieldTemplate = identificadorTransacao ? formatarCampo('62', formatarCampo('05', identificadorTransacao)) : ''; // Identificador da transação

    // Concatena todos os campos antes de calcular o CRC
    const payloadSemCRC = payloadFormatIndicator + merchantAccountInfo + merchantCategoryCode + transactionCurrency + transactionAmount + countryCode + merchantName + merchantCity + additionalDataFieldTemplate + '6304'; // Campo CRC placeholder

    // Função para calcular o CRC16
    const crc16 = (str) => {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
            }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    };

    // Calcula o CRC16 e adiciona ao final do payload
    const crc = crc16(payloadSemCRC);
    return payloadSemCRC + crc;
}

let GenerateKeyRandom = function (length) {
    let result = '';
    let characters = '0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}