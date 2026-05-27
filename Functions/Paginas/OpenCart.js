const { default: axios } = require("axios");
const { MessageFlags, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const e = require("express");
const { JsonDatabase } = require("wio.db");

const dbPanels = new JsonDatabase({ databasePath: "./databases/dbPanels.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" })
const dbOpenedCarts = new JsonDatabase({ databasePath: "./databases/dbOpenedCarts.json" });
const dbProfiles = new JsonDatabase({ databasePath: "./databases/dbProfiles.json" });

const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });



async function OpenCart(client, interaction, produto, panelId) {
    await interaction.deferReply({ flags: "Ephemeral" })

    const colorC = await dbConfigs.get(`${produto}.embeds.color`)
    const colorP = await dbPanels.get(`${panelId}.embed.color`);
    const roleStaffsID = await dbConfigs.get(`vendas.roles.roleStaffID`);
    const estrelaEmoji = `<a:estrela:${dbe.get('estrela')}>`;
    const lupaEmoji = `<:lupa:${await dbe.get('lupa')}>`;
    const docEmoji = `<:doc:${await dbe.get('doc')}>`;
    const loadingEmoji = `<a:loading:${await dbe.get('loading')}>`;
    const cancelarEmoji = `<:cancelar:${await dbe.get('cancelar')}>`;
    const lembreteEmoji = `<a:lembrete:${await dbe.get('lembrete')}>`;
    const checkEmoji = `<:check:${await dbe.get('check')}>`;

    interaction.message.edit()
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true }); // Defere a resposta
    }

    await interaction.editReply({
        content: `${loadingEmoji} Gerando / Adicionando seu produto ao carrinho...`
    });

    const statusNewSales = await dbConfigs.get(`vendas.newSales`);
    if (!statusNewSales) {
        return await interaction.editReply({
            content: `❌ | Não é possível abrir novos carrinhos pois o sistema de vendas está desabilitado.`,
            flags: MessageFlags.Ephemeral
        });
    };

    let categoryCartsId = await dbConfigs.get(`vendas.channels.categoryCartsId`);
    if (categoryCartsId == `none`) {
        // return interaction.editReply({
        //     content: `❌ | Configure uma categoria para a abertura de novos carrinhos.`,
        //     flags: MessageFlags.Ephemeral
        // });
        // pegue a categoria q ele interagiu e use ela
        categoryCartsId = interaction.channel.parentId || null
    } else {
        const categoryCartsGuild = interaction.guild.channels.cache.get(categoryCartsId);
        if (!categoryCartsGuild) {
            // return interaction.editReply({
            //     content: `❌ | A categoria com o ID: **${categoryCartsId}** configurada não foi localizada.`,
            //     flags: MessageFlags.Ephemeral
            // });
            categoryCartsId = interaction.channel.parentId || null
        };

    };

    let product = await dbProducts.get(produto);

    const amountStock = product.stock.length;
    if (amountStock < 1) {
        return interaction.editReply({
            content: `${cancelarEmoji} | Este produto está sem estoque. Aguarde um reabastecimento!`,
            components: [new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`enableNotifications-${produto}`).setLabel(`Ativar Notificações`).setEmoji(`${lembreteEmoji}`).setStyle(`Secondary`)
                )
            ],
            flags: MessageFlags.Ephemeral
        });
    }


    let channelexist = interaction.guild.channels.cache.find(channel => channel.topic === `Carrinho ${interaction.user.id}`);

    if (channelexist) {
        //console.log(channelexist)
        let algo = await AdiconarProdutoCart(client, interaction, channelexist, produto)

        if (algo == false) return

        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setDescription(`✅ | Produto adicionado em seu carrinho.`)
                .setColor(`Green`)
            ],
            components: [new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(`Redirecionar`)
                        .setStyle(`Link`)
                        .setURL(channelexist.url)
                )
            ],
            flags: MessageFlags.Ephemeral
        });

    } else {
        let channel = await interaction.guild.channels.create({
            name: `🛒・${interaction.user.username}`,
            type: 0,
            parent: categoryCartsId,
            topic: `Carrinho ${interaction.user.id}`,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages
                    ],
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages
                    ]
                }
            ]
        })

        const rowCart = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`acceptContinue`).setLabel(`Aceitar e Continuar`).setEmoji(`${checkEmoji}`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`cancelCart`).setLabel(`Cancelar Compra`).setEmoji(`${cancelarEmoji}`).setStyle(`Danger`),
                new ButtonBuilder().setCustomId(`viewTerms`).setLabel(`Ler os Termos`).setEmoji(`${docEmoji}`).setStyle(`Primary`)
            )

        const embedCart = new EmbedBuilder()
            .setTitle(`${client.user.username} | Carrinho de Compras`)
            .setDescription(`${lupaEmoji} | Olá **${interaction.user.username}**, Este é o seu carrinho. Sinta-se à vontade para adicionar mais produtos ou fazer as modificações que achar necessário.\n\n${estrelaEmoji} | Lembre-se de ler nossos termos de compra para evitar problemas futuros. Ao prosseguir, você concorda com nossos termos.\n\n${lembreteEmoji} | Quando estiver tudo pronto, aperte o botão abaixo para continuar com sua compra!`)
            .setColor(colorP != "none" ? colorP : colorC != "none" ? colorC : "#460580")

        await channel.send({
            content: `${interaction.user} | <@&${roleStaffsID}>`,
            embeds: [embedCart],
            components: [rowCart]
        })

        await dbOpenedCarts.set(`${channel.id}.page`, `configuring-products-home`);
        await dbOpenedCarts.set(`${channel.id}.userId`, interaction.user.id);
        await dbOpenedCarts.set(`${channel.id}.createdDate`, Date.now());
        await dbOpenedCarts.set(`${channel.id}.guildId`, interaction.guild.id);
        await dbOpenedCarts.set(`${channel.id}.products`, {})

        await AdiconarProdutoCart(client, interaction, channel, produto)

        await interaction.editReply({
            content: ``,
            embeds: [new EmbedBuilder()
                .setTitle(`Carrinho Criado`)
                .setDescription(`Seu carrinho foi criado com sucesso, adicione os produtos que deseja comprar.\n-# Para se redirecionar ao carrinho clique no botão abaixo.`)
                .setColor('Green')
            ],
            components: [new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(`Redirecionar`)
                        .setStyle(`Link`)
                        .setURL(channel.url)
                )
            ],
            flags: MessageFlags.Ephemeral
        });

        let createdDate = `<t:${Math.floor(Date.now() / 1000)}:f> (<t:${Math.floor(Date.now() / 1000)}:R>)`;
        const channelLogsPriv = interaction.guild.channels.cache.get(dbConfigs.get(`vendas.channels.channelLogsPrivId`));
        if (channelLogsPriv) {
            await channelLogsPriv.send({
                embeds: [new EmbedBuilder()
                    .setAuthor({ name: `${interaction.user.username} - ${interaction.user.id}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })
                    .setTitle(`Carrinho Criado`)
                    .addFields(
                        { name: `👤 | COMPRADOR(A):`, value: `${interaction.user} | ${interaction.user.username}` },
                        { name: `🪐 | Produto:`, value: `${product.name} x1` },
                        { name: `⏰ | Data & Horário:`, value: `${createdDate}` }
                    )
                    .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                    .setColor(`Green`)
                    .setTimestamp()
                ]
            });
        };
    }
}





async function AdiconarProdutoCart(client, interaction, channel, productId) {
    const colorC = await dbConfigs.get(`${productId}.embeds.color`)
    const docEmoji = `<:doc:${await dbe.get('doc')}>`;
    const caixaEmoji = `<:caixa:${dbe.get('caixa')}>`;
    const dinheiroEmoji = `<:dinheiro:${await dbe.get('dinheiro')}>`;
    const carrinhoEmoji = `<:carrinho:${await dbe.get('carrinho')}>`;



    let product = await dbProducts.get(productId);
    const pageChannel = await dbOpenedCarts.get(`${channel.id}.page`);
    let components = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setURL(channel.url).setLabel(`Redirecionar`).setStyle(5),
        )

    let qtdProducts = await dbOpenedCarts.get(`${channel.id}.products`);
    if (!qtdProducts) qtdProducts = {}
    qtdProducts = Object.keys(qtdProducts).length;
    if (qtdProducts >= 10) {
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setDescription(`❌ | Você atingiu o limite de produtos em seu carrinho!`)
                .setColor(`Red`)
            ],
            components: [components],
            flags: MessageFlags.Ephemeral
        });
        return false
    }


    if (pageChannel != `configuring-products-home`) {
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setDescription(`❌ | Não é possivel adicionar novos produtos em seu carrinho!`)
                .setColor(`Red`)
            ],
            components: [components],
            content: ``,
            flags: MessageFlags.Ephemeral
        });
        return false
    };

    const channelProduct = await dbOpenedCarts.get(`${channel.id}.products.p-${productId}`)
    if (channelProduct) {
        interaction.editReply({
            content: `❌ | Este produto já está no seu carrinho!`,
            flags: MessageFlags.Ephemeral,
            components: [components]
        });
        return false
    }
    let amountStock = product.stock.length;


    await dbOpenedCarts.set(`${channel.id}.products.p-${productId}`, {
        productId: productId,
        productName: product.name,
        productPrice: Number(product.price),
        productStock: amountStock,
        purchasePrice: Number(product.price),
        purchaseAmount: 1
    })
    await dbOpenedCarts.set(`${channel.id}.purchaseCoupon`, {
        couponId: `none`,
        couponDiscount: `none`
    });

    const rowNewProduct = new ActionRowBuilder()
        .addComponents(
            //new ButtonBuilder().setCustomId(`addOne-${productId}`).setEmoji(`<:mais:1306409478396182549>`).setStyle(`Secondary`),
            new ButtonBuilder().setCustomId(`editAmount-${productId}`).setLabel(`Alterar Quantidade`).setEmoji(`<:editar:1341480286113759272>`).setStyle(1),
            //new ButtonBuilder().setCustomId(`removeOne-${productId}`).setEmoji(`<:menos:1289647503398146099>`).setStyle(`Secondary`),
            new ButtonBuilder().setCustomId(`delProduct-${productId}`).setEmoji(`<:1225478281285865576:1289647477196324914>`).setStyle(`Danger`)
        );

    const embedNewProduct = new EmbedBuilder()
        .setDescription(`${docEmoji}・Produto: \`${product.name}\`\n\n${caixaEmoji}・Quantidade: \`1\`\n\n${dinheiroEmoji}・ Preço: \`${Number(product.price).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n\n${carrinhoEmoji}・Quantidade disponível: \`${amountStock}\``)
        .setColor(colorC !== "none" ? colorC : "#460580");

    await channel.send({
        embeds: [embedNewProduct],
        components: [rowNewProduct]
    });

}

async function EditQtd(client, interaction, productId) {
    const colorC = await dbConfigs.get(`${productId}.embeds.color`)
    const docEmoji = `<:doc:${await dbe.get('doc')}>`;
    const caixaEmoji = `<:caixa:${dbe.get('caixa')}>`;
    const dinheiroEmoji = `<:dinheiro:${await dbe.get('dinheiro')}>`;
    const carrinhoEmoji = `<:carrinho:${await dbe.get('carrinho')}>`;

    let product = await dbProducts.get(productId);
    let qtd = await dbOpenedCarts.get(`${interaction.channel.id}.products.p-${productId}`);
    let valor = qtd.purchaseAmount * qtd.productPrice;

    const embedNewProduct = new EmbedBuilder()
        .setDescription(`${docEmoji}・Produto: \`${product.name}\`\n\n${caixaEmoji}・Quantidade: \`${qtd.purchaseAmount}\`\n\n${dinheiroEmoji}・Preço: \`${Number(valor).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n\n${carrinhoEmoji}・Quantidade disponível: \`${qtd.productStock}\``)
        .setColor(colorC !== "none" ? colorC : "#460580");

    interaction.update({
        embeds: [embedNewProduct]
    })


}


async function AceitarEContinuar(client, interaction) {

    const colorP = await dbConfigs.get(`vendas.embed.color`);

    const dinheiroEmoji = `<:dinheiro:${await dbe.get('dinheiro')}>`;
    const caixaEmoji = `<:caixa:${dbe.get('caixa')}>`;
    const docEmoji = `<:doc:${await dbe.get('doc')}>`;
    const carrinhoEmoji = `<:carrinho:${await dbe.get('carrinho')}>`;
    const cupomEmoji = `<:cupom:${await dbe.get('cupom')}>`;
    const cancelarEmoji = `<:cancelar:${await dbe.get('cancelar')}>`;



    let CartOn = dbOpenedCarts.get(`${interaction.channel.id}`);

    if (!CartOn) {
        return interaction.reply({
            content: `❌ | Este carrinho não está mais disponível.`,
            flags: MessageFlags.Ephemeral
        });
    }

    const productIds = Object.keys(CartOn.products)
    if (productIds.length < 1) {
        return interaction.reply({
            content: `❌ | Seu carrinho está vazio. Adicione produtos para continuar.`,
            flags: MessageFlags.Ephemeral
        });
    }
    let useCouponsStatus = true

    let allProductsIds = [];
    let allProductsNames = [];
    let allProducts = [];
    let totalPrice = 0;
    let message2 = ``
    let valor2 = ``

    for (const pId of productIds) {
        let productDetails = await CartOn.products[pId];
        const productName = productDetails.productName;
        const productPrice = productDetails.productPrice;
        const purchasePrice = productDetails.purchasePrice;
        const purchaseAmount = productDetails.purchaseAmount;

        let pId2 = pId.replace(`p-`, ``);
        const statusCupom2 = await dbProducts.get(`${pId2}.useCoupon`);
        if (!statusCupom2) {
            useCouponsStatus = false
        }

        totalPrice += Number(productDetails.productPrice) * Number(productDetails.purchaseAmount);

        const formattedProduct = `${docEmoji}・Produto: \`${productName}\`\n${dinheiroEmoji}・Preço Unitário: \`${Number(productPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n${caixaEmoji}・Quantidade: \`${Number(purchaseAmount)}\`\n${carrinhoEmoji}・Total: \`${Number(purchasePrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``;
        allProducts.push(formattedProduct);

        const formattedProductName = `${productName} x${purchaseAmount}`;
        allProductsNames.push(formattedProductName);


        let produtoStockInfoQuantidade = await dbProducts.get(`${pId2}.stock`)
        message2 += `\`${Number(purchaseAmount)}/${produtoStockInfoQuantidade.length} ${productName}\`\n`
        valor2 += `\`${Number(Number(productDetails.productPrice) * Number(productDetails.purchaseAmount)).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n`


        allProductsIds.push(pId.replace(`p-`, ``));

    }

    await interaction.channel.bulkDelete(50)

    await dbOpenedCarts.set(`${interaction.channel.id}.page`, `configuring-products-end`);

    const couponId = await dbOpenedCarts.get(`${interaction.channel.id}.purchaseCoupon.couponId`);

    const rowResumeProduct = new ActionRowBuilder();

    if (useCouponsStatus) {
        rowResumeProduct.addComponents(
            new ButtonBuilder().setCustomId(`toPayment`).setLabel(`Finalizar Pagamento`).setEmoji(`<:exit:1359555432615514154>`).setStyle(`Success`),
            new ButtonBuilder().setCustomId(`addCoupon`).setLabel(`Cupom`).setEmoji(`${cupomEmoji}`).setStyle(`Primary`),
            new ButtonBuilder().setCustomId(`cancelCart`).setLabel(`Cancelar`).setEmoji(`${cancelarEmoji}`).setStyle(`Danger`)
        );
    } else {
        rowResumeProduct.addComponents(
            new ButtonBuilder().setCustomId(`toPayment`).setLabel(`Finalizar Pagamento`).setEmoji(`<:exit:1359555432615514154>`).setStyle(`Success`),
            new ButtonBuilder().setCustomId(`addCoupon`).setLabel(`Cupom`).setEmoji(`${cupomEmoji}`).setStyle(`Primary`).setDisabled(true),
            new ButtonBuilder().setCustomId(`cancelCart`).setLabel(`Cancelar`).setEmoji(`${cancelarEmoji}`).setStyle(`Danger`)
        );
    };

    const embedResumeProduct = new EmbedBuilder()
        .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.avatarURL({ dynamic: true }) })
        .setTitle(`Resumo da Compra`)
        .setDescription(`> Confira abaixo os produtos no seu carrinho e o valor total.\n-# Você pode ajustar a quantidade ou adicionar/remover produtos.`)
        .addFields(
            { name: 'Produto', value: `${message2}`, inline: true },
            { name: 'Valor', value: `${valor2}`, inline: true },
            { name: 'Valor total', value: `\`${Number(totalPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: false }
        )
        .setFooter({ text: `${client.user.username} - Todos os direitos reservados © ${new Date().getFullYear()} • Hoje às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, iconURL: client.user.avatarURL({ dynamic: true }) })
        .setColor(colorP != "none" ? colorP : "#460580")

    const roleStaffsID = await dbConfigs.get(`vendas.roles.roleStaffID`);
    await interaction.channel.send({
        content: `${interaction.user} | <@&${roleStaffsID}>`,
        embeds: [embedResumeProduct],
        components: [rowResumeProduct]
    });
}






async function PaginaPayment(client, interaction) {

    await interaction.deferUpdate();

    const dinheiroEmoji = `<:dinheiro:${await dbe.get('dinheiro')}>`;
    const docEmoji = `<:doc:${await dbe.get('doc')}>`;
    const cancelarEmoji = `<:cancelar:${await dbe.get('cancelar')}>`;
    const checkEmoji = `<:check:${await dbe.get('check')}>`;
    const pixEmoji = `<:pix:${await dbe.get('pix')}>`;
    const qrcodeEmoji = `<:qrcode:${await dbe.get('qrcode')}>`;
    const caixaEmoji = `<:caixa:${dbe.get('caixa')}>`;
    const carrinhoEmoji = `<:carrinho:${await dbe.get('carrinho')}>`;
    const cupomEmoji = `<:cupom:${await dbe.get('cupom')}>`;
    const colorP = await dbConfigs.get(`vendas.embed.color`);
    let CartOn = dbOpenedCarts.get(`${interaction.channel.id}`);
    const productIds = Object.keys(CartOn.products)
    let useCouponsStatus = true

    let allProductsIds = [];
    let allProductsNames = [];
    let allProducts = [];
    let totalPrice = 0;

    let message2 = ``
    let logmessage6 = ``


    let cupomexist = await dbOpenedCarts.get(`${interaction.channel.id}.purchaseCoupon.couponDiscount`)

    for (const pId of productIds) {
        let productDetails = await CartOn.products[pId];
        const productName = productDetails.productName;
        const productPrice = productDetails.productPrice;
        const purchasePrice = productDetails.purchasePrice;
        const purchaseAmount = productDetails.purchaseAmount;

        let pId2 = pId.replace(`p-`, ``);
        const statusCupom2 = await dbProducts.get(`${pId2}.useCoupon`);
        if (!statusCupom2) {
            useCouponsStatus = false
        }

        totalPrice += Number(productDetails.productPrice) * Number(productDetails.purchaseAmount);

        const formattedProduct = `${docEmoji}・Produto: \`${productName}\`\n${dinheiroEmoji}・Preço Unitário: \`${Number(productPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\`\n${caixaEmoji}・Quantidade: \`${Number(purchaseAmount)}\`\n${carrinhoEmoji}・Total: \`${Number(purchasePrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``;
        allProducts.push(formattedProduct);

        const formattedProductName = `${productName} x${purchaseAmount}`;
        allProductsNames.push(formattedProductName);
        const valorProduto = Number(productDetails.productPrice) * Number(productDetails.purchaseAmount)
        logmessage6 += `\`${Number(valorProduto).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\` - \`${productName} (${purchaseAmount} unidade)\`\n`


        allProductsIds.push(pId.replace(`p-`, ``));

        message2 += `\`${Number(purchaseAmount)}x ${productName}\`\n`

    }

    let cupomDiscount = cupomexist == "none" ? 0 : cupomexist
    let totalDiscount = totalPrice * (cupomDiscount / 100)
    totalPrice = totalPrice - totalDiscount

    const semiAutoPayment = await dbConfigs.get(`vendas.payments.paymentsOptions.semiAuto`);

    if (semiAutoPayment) {
        const rowPixPayment = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`pixKey`).setLabel(`Chave PIX`).setEmoji(`<:1289360523074207807:1289647527515127961>`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`qrCode`).setLabel(`QR Code`).setEmoji(`<:QRCODE:1328739559026065530>`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`approvePurchaseManual_${interaction.user.id}`).setLabel(`Aprovar Compra`).setStyle(`Success`),
                new ButtonBuilder().setCustomId(`cancelPaymentManual-${interaction.channel.id}`).setLabel(`Cancelar compra`).setStyle(`Danger`)
            );

        const embedPixPayment = new EmbedBuilder()
            .setTitle(`Confirmação de Compra`)
            .setDescription(`> Verifique se os produtos estão corretos e escolha o método de pagamento desejado.\n-# **Aprovação manual:** Após efetuar o pagamento, alguém da equipe irá aprovar a compra.`)
            .addFields(
                { name: `Produtos`, value: `${logmessage6}`, inline: false },
                { name: `Valor total`, value: `\`${Number(totalPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                { name: `Desconto`, value: `\`${Number(totalDiscount).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
            )
            .setFooter({ text: `Após efetuar o pagamento, mande o comprovante e aguarde a entrega`, iconURL: client.user.avatarURL({ dynamic: true }) })
            .setColor(colorP != "none" ? colorP : "#460580")

        await interaction.editReply({
            content: `${interaction.user}`,
            embeds: [embedPixPayment],
            components: [rowPixPayment]
        });

        await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
            ViewChannel: true,
            SendMessages: true,
            AttachFiles: true
        });

        dbOpenedCarts.set(`${interaction.channel.id}.status`, `semiauto`);

        return
    }


    const tokenMp = await dbConfigs.get(`vendas.payments.mpAcessToken`)
    let mptoggle = await dbConfigs.get(`vendas.payments.paymentsOptions.pix`)

    if (mptoggle !== false) {
        if (tokenMp != `none`) {
            await axios.get(`https://api.mercadopago.com/v1/payments/search`, {
                headers: {
                    "Authorization": `Bearer ${tokenMp}`
                }
            }).then(async (response) => {
                mptoggle = true
            }).catch(async (err) => {
                mptoggle = false
            })
        }
    }

    let efitoggle = await dbConfigs.get(`vendas.payments.paymentsOptions.EfiBank`) || false
    let saldotoggle = await dbConfigs.get(`vendas.payments.paymentsOptions.balance`)
    let StripeToggle = await dbConfigs.get(`vendas.payments.paymentsOptions.Stripe`)
    let eSalesToggle = await dbConfigs.get(`vendas.payments.paymentsOptions.eSales`)
    let nubankToggle = await dbConfigs.get(`vendas.payments.Nubank`)


    if (mptoggle == false && efitoggle == false && saldotoggle == false && StripeToggle == false && eSalesToggle == false && nubankToggle == false) {
        await interaction.followUp({
            content: `❌ Não há métodos de pagamento disponíveis, configure um método de pagamento para continuar.`,
            flags: MessageFlags.Ephemeral
        });
        return
    }


    let buttons = new ActionRowBuilder()
    if (eSalesToggle) {
        buttons.addComponents(
            new ButtonBuilder().setCustomId(`selectpayment-esales`).setLabel(`Pagar com Pix`).setEmoji(`<:1289360695695118451:1289647535304085565>`).setStyle(1)
        )
    } else if (mptoggle) {
        buttons.addComponents(
            new ButtonBuilder().setCustomId(`selectpayment-mercadoPago`).setLabel(`Pagar com Pix`).setEmoji(`<:1289360695695118451:1289647535304085565>`).setStyle(1)
        )
    } else if (efitoggle) {
        buttons.addComponents(
            new ButtonBuilder().setCustomId(`selectpayment-efiBank`).setLabel(`Pagar com Pix`).setEmoji(`<:1289360695695118451:1289647535304085565>`).setStyle(1)
        )
    } else if (nubankToggle) {
        buttons.addComponents(
            new ButtonBuilder().setCustomId(`selectpayment-nubank`).setLabel(`Pagar com Pix`).setEmoji(`<:1289360695695118451:1289647535304085565>`).setStyle(1)
        )
    }

    let saldo = await dbProfiles.get(`${interaction.user.id}.balance`)

    if (saldotoggle) {
        buttons.addComponents(
            new ButtonBuilder().setCustomId(`selectpayment-saldo`).setLabel(`Pagar com Saldo`).setEmoji(`<:moedas:1359554216040861746>`).setStyle(3).setDisabled(saldo < totalPrice)
        )
    }

    if (StripeToggle) {
        buttons.addComponents(
            new ButtonBuilder().setCustomId(`selectpayment-stripe`).setLabel(`Cartão de Crédito`).setEmoji(`<:card:1356704259432910988>`).setStyle(1)
        )
    }

    buttons.addComponents(
        new ButtonBuilder().setCustomId(`cancelCart`).setLabel(`Cancelar compra`).setStyle(`Danger`)
    )

    const embedFormPayment = new EmbedBuilder()
        .setTitle(`Método de Pagamento`)
        .setDescription(`Escolha o método de pagamento para finalizar a compra.`)
        .addFields(
            { name: `Produtos no carrinho:`, value: `${message2}`, inline: true },
            { name: `Valor total:`, value: `\`${Number(totalPrice).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: false },
        )
        .setColor(colorP != "none" ? colorP : "#460580")
        .setTimestamp()

    if (saldotoggle) {
        embedFormPayment.setFooter({ text: `Saldo disponível: ${Number(saldo).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}` })
    }

    await interaction.editReply({
        content: `${interaction.user}`,
        embeds: [embedFormPayment],
        components: [buttons]
    });
}

module.exports = {
    OpenCart,
    EditQtd,
    AceitarEContinuar,
    PaginaPayment
}
