const {
    MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder, RoleSelectMenuBuilder,
    ChannelSelectMenuBuilder, ModalBuilder, TextInputBuilder, ChannelType
} = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");

const dbCoupons = new JsonDatabase({ databasePath: "./databases/dbCoupons.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("config-cupom")
        .setDescription("Configure um cupom de desconto!")
        .addStringOption(opString => opString
            .setName("nome")
            .setDescription("Nome do Cupom")
            .setMaxLength(25)
            .setAutocomplete(true)
            .setRequired(true)
        ),

    async autocomplete(interaction) {
        const choices = [];

        
        const dono = getCache(null, "owner");
        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
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

        for (const coupon of dbCoupons.all()) {
            choices.push({
                name: `Nome: ${coupon.ID} | Desconto: ${coupon.data.discount}% | Quantidade: ${coupon.data.stock}`,
                value: coupon.ID,
            });
        };
        choices.sort((a, b) => a.value - b.value);

        const searchId = interaction.options.getString("nome");
        if (searchId) {
            const filteredChoices = choices.filter(choice => {
                return choice.value.startsWith(searchId);
            });
            await interaction.respond(
                filteredChoices.map(choice => ({ name: choice.name, value: choice.value })),
            );
        } else {
            const limitedChoices = choices.slice(0, 25);
            await interaction.respond(
                limitedChoices.map(choice => ({ name: choice.name, value: choice.value }))
            );
        };
    },

    async execute(interaction, client) {
        const colorC = await dbConfigs.get(`vendas.embeds.color`)
        //let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
        //if (type?.Vendas?.status !== true) {
            //interaction.reply({ content: `❌ | Comando desabilitado pois o sistema de vendas não está ativo.`, flags: MessageFlags.Ephemeral })
            //return
        //}

        const choices = [];

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
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

        const nameCoupon = interaction.options.getString("nome");

        if (!dbCoupons.has(nameCoupon)) {
            await interaction.reply({
                content: `❌ | ID do cupom: **${nameCoupon}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        const guildI = interaction.guild;
        const channelI = interaction.channel;

        const discountC = await dbCoupons.get(`${nameCoupon}.discount`);
        const stockC = await dbCoupons.get(`${nameCoupon}.stock`);
        const roleC = await dbCoupons.get(`${nameCoupon}.role`);
        const minimumPurchaseC = await dbCoupons.get(`${nameCoupon}.minimumPurchase`);

        const minimumPurchaseFormatted = minimumPurchaseC != 0 ? `${Number(minimumPurchaseC).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}` : `Qualquer valor.`;
        const roleFormatted = roleC != "none" ? guildI.roles.cache.get(roleC) || `\`${roleC} não encontrado.\`` : `\`Qualquer usuário.\``;

        const rowCoupon1 = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder().setCustomId(`changesConfigCoupon`).setPlaceholder(`Selecione uma opção (Cupom)`)
                    .setOptions(
                        new StringSelectMenuOptionBuilder().setLabel(`Alterar Desconto`).setEmoji(`💸`).setDescription(`Altere a porcentagem de desconto do seu cupom.`).setValue(`changeDiscount`),
                        new StringSelectMenuOptionBuilder().setLabel(`Alterar Valor Mínimo`).setEmoji(`🛒`).setDescription(`Altere o valor mínimo de compra do seu cupom.`).setValue(`changeMinimumPurchase`),
                        new StringSelectMenuOptionBuilder().setLabel(`Alterar Quantidade`).setEmoji(`📦`).setDescription(`Altere a quantidade de usos do seu cupom.`).setValue(`changeStock`),
                        new StringSelectMenuOptionBuilder().setLabel(`Alterar Cargo`).setEmoji(`👤`).setDescription(`Altere o cargo necessário para utilizar seu cupom.`).setValue(`changeRole`)
                    )
            );

        const rowCoupon2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`deleteCoupon`).setLabel(`DELETAR`).setEmoji(`<:lixo:1236083085636796416>`).setStyle(`Danger`)
            );

        const embedCoupon = new EmbedBuilder()
            .setTitle(`${client.user.username} | Configurando Cupom`)
            .setDescription(`**📝 | Nome: \`${nameCoupon}\`\n💸 | Desconto: \`${discountC}%\`\n🛒 | Valor Mínimo: \`${minimumPurchaseFormatted}\`\n📦 | Quantidade: \`${stockC}\`\n\n👤 | Disponível apenas para o cargo: ${roleFormatted}**`)
            .setColor(colorC !== "none" ? colorC : "#460580")
            .setFooter({ text: `${client.user.username} - Todos os direitos reservados.`, iconURL: client.user.avatarURL() });

        await interaction.reply({
            embeds: [embedCoupon],
            components: [rowCoupon1, rowCoupon2]
        }).then(async (msg) => {
            const filter = (m) => m.user.id == interaction.user.id;
            const collectorConfig = msg.createMessageComponentCollector({
                filter: filter,
                time: 600000
            });
            collectorConfig.on("collect", async (iConfig) => {
                if (iConfig.customId == `changesConfigCoupon`) {
                    await iConfig.deferUpdate();

                    await msg.edit({
                        components: [rowCoupon1, rowCoupon2]
                    });

                    const valueId = iConfig.values[0];

                    if (valueId == `changeDiscount`) {
                        const discountC = await dbCoupons.get(`${nameCoupon}.discount`);

                        await msg.edit({
                            embeds: [new EmbedBuilder()
                                .setTitle(`${client.user.username} | Desconto`)
                                .setDescription(`Envie a porcentagem de desconto que será utilizado! \`(${discountC}%)\``)
                                .setFooter({ text: `Você tem 2 minutos para enviar.` })
                                .setColor(colorC !== "none" ? colorC : "#460580")
                            ],
                            components: [new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder().setCustomId(`previousPageConfigsCoupon-${nameCoupon}`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                )
                            ]
                        });

                        const collectorMsg = channelI.createMessageCollector({
                            filter: (m) => m.author.id == interaction.user.id,
                            max: 1,
                            time: 120000
                        });
                        collectorMsg.on("collect", async (iMsg) => {
                            await iMsg.delete();

                            const msgContent = iMsg.content
                                .trim()
                                .replace(`%`, ``);

                            if (isNaN(msgContent)) {
                                const discountC = await dbCoupons.get(`${nameCoupon}.discount`);
                                const stockC = await dbCoupons.get(`${nameCoupon}.stock`);
                                const roleC = await dbCoupons.get(`${nameCoupon}.role`);
                                const categoryC = await dbCoupons.get(`${nameCoupon}.category`);
                                const minimumPurchaseC = await dbCoupons.get(`${nameCoupon}.minimumPurchase`);

                                const minimumPurchaseFormatted = minimumPurchaseC != 0 ? `${Number(minimumPurchaseC).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}` : `Qualquer valor.`;
                                const roleFormatted = roleC != "none" ? guildI.roles.cache.get(roleC) || `\`${roleC} não encontrado.\`` : `\`Qualquer usuário.\``;
                                const categoryFormatted = categoryC != "none" ? guildI.channels.cache.get(categoryC) || `\`${categoryC} não encontrado.\`` : `\`Qualquer produto.\``;

                                const embedCoupon = new EmbedBuilder()
                                    .setTitle(`${client.user.username} | Configurando Cupom`)
                                    .setDescription(`**📝 | Nome: \`${nameCoupon}\`\n💸 | Desconto: \`${discountC}%\`\n🛒 | Valor Mínimo: \`${minimumPurchaseFormatted}\`\n📦 | Quantidade: \`${stockC}\`\n\n👤 | Disponível apenas para o cargo: ${roleFormatted}**`)
                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                    .setFooter({ text: `${client.user.username} - Todos os direitos reservados.`, iconURL: client.user.avatarURL() });

                                await msg.edit({
                                    embeds: [embedCoupon],
                                    components: [rowCoupon1, rowCoupon2]
                                });

                                await iConfig.followUp({
                                    content: `❌ | O desconto inserido é inválido. Experimente utilizar o formato correto, por exemplo: **15%** ou **15**.`,
                                    flags: MessageFlags.Ephemeral
                                });
                                return;
                            };

                            await dbCoupons.set(`${nameCoupon}.discount`, msgContent);

                            const discountC = await dbCoupons.get(`${nameCoupon}.discount`);
                            const stockC = await dbCoupons.get(`${nameCoupon}.stock`);
                            const roleC = await dbCoupons.get(`${nameCoupon}.role`);
                            const categoryC = await dbCoupons.get(`${nameCoupon}.category`);
                            const minimumPurchaseC = await dbCoupons.get(`${nameCoupon}.minimumPurchase`);

                            const minimumPurchaseFormatted = minimumPurchaseC != 0 ? `${Number(minimumPurchaseC).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}` : `Qualquer valor.`;
                            const roleFormatted = roleC != "none" ? guildI.roles.cache.get(roleC) || `\`${roleC} não encontrado.\`` : `\`Qualquer usuário.\``;
                            const categoryFormatted = categoryC != "none" ? guildI.channels.cache.get(categoryC) || `\`${categoryC} não encontrado.\`` : `\`Qualquer produto.\``;

                            const embedCoupon = new EmbedBuilder()
                                .setTitle(`${client.user.username} | Configurando Cupom`)
                                .setDescription(`**📝 | Nome: \`${nameCoupon}\`\n💸 | Desconto: \`${discountC}%\`\n🛒 | Valor Mínimo: \`${minimumPurchaseFormatted}\`\n📦 | Quantidade: \`${stockC}\`\n\n👤 | Disponível apenas para o cargo: ${roleFormatted}**`)
                                .setColor(colorC !== "none" ? colorC : "#460580")
                                .setFooter({ text: `${client.user.username} - Todos os direitos reservados.`, iconURL: client.user.avatarURL() });

                            await msg.edit({
                                embeds: [embedCoupon],
                                components: [rowCoupon1, rowCoupon2]
                            });
                        });

                        collectorMsg.on("end", async (c, r) => {
                            if (r == "time") {
                                const discountC = await dbCoupons.get(`${nameCoupon}.discount`);
                                const stockC = await dbCoupons.get(`${nameCoupon}.stock`);
                                const roleC = await dbCoupons.get(`${nameCoupon}.role`);
                                const categoryC = await dbCoupons.get(`${nameCoupon}.category`);
                                const minimumPurchaseC = await dbCoupons.get(`${nameCoupon}.minimumPurchase`);

                                const minimumPurchaseFormatted = minimumPurchaseC != 0 ? `${Number(minimumPurchaseC).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}` : `Qualquer valor.`;
                                const roleFormatted = roleC != "none" ? guildI.roles.cache.get(roleC) || `\`${roleC} não encontrado.\`` : `\`Qualquer usuário.\``;
                                const categoryFormatted = categoryC != "none" ? guildI.channels.cache.get(categoryC) || `\`${categoryC} não encontrado.\`` : `\`Qualquer produto.\``;

                                const embedCoupon = new EmbedBuilder()
                                    .setTitle(`${client.user.username} | Configurando Cupom`)
                                    .setDescription(`**📝 | Nome: \`${nameCoupon}\`\n💸 | Desconto: \`${discountC}%\`\n🛒 | Valor Mínimo: \`${minimumPurchaseFormatted}\`\n📦 | Quantidade: \`${stockC}\`\n\n👤 | Disponível apenas para o cargo: ${roleFormatted}**`)
                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                    .setFooter({ text: `${client.user.username} - Todos os direitos reservados.`, iconURL: client.user.avatarURL() });

                                await msg.edit({
                                    embeds: [embedCoupon],
                                    components: [rowCoupon1, rowCoupon2]
                                });
                            };
                        });

                        try {
                            const collectorFilter = (i) => i.user.id == interaction.user.id;
                            const iAwait = await msg.awaitMessageComponent({ filter: collectorFilter, time: 120000 });

                            if (iAwait.customId == `previousPageConfigsCoupon-${nameCoupon}`) {
                                await iAwait.deferUpdate();

                                const discountC = await dbCoupons.get(`${nameCoupon}.discount`);
                                const stockC = await dbCoupons.get(`${nameCoupon}.stock`);
                                const roleC = await dbCoupons.get(`${nameCoupon}.role`);
                                const categoryC = await dbCoupons.get(`${nameCoupon}.category`);
                                const minimumPurchaseC = await dbCoupons.get(`${nameCoupon}.minimumPurchase`);

                                const minimumPurchaseFormatted = minimumPurchaseC != 0 ? `${Number(minimumPurchaseC).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}` : `Qualquer valor.`;
                                const roleFormatted = roleC != "none" ? guildI.roles.cache.get(roleC) || `\`${roleC} não encontrado.\`` : `\`Qualquer usuário.\``;
                                const categoryFormatted = categoryC != "none" ? guildI.channels.cache.get(categoryC) || `\`${categoryC} não encontrado.\`` : `\`Qualquer produto.\``;

                                const embedCoupon = new EmbedBuilder()
                                    .setTitle(`${client.user.username} | Configurando Cupom`)
                                    .setDescription(`**📝 | Nome: \`${nameCoupon}\`\n💸 | Desconto: \`${discountC}%\`\n🛒 | Valor Mínimo: \`${minimumPurchaseFormatted}\`\n📦 | Quantidade: \`${stockC}\`\n\n👤 | Disponível apenas para o cargo: ${roleFormatted}**`)
                                    .setColor(colorC !== "none" ? colorC : "#460580")
                                    .setFooter({ text: `${client.user.username} - Todos os direitos reservados.`, iconURL: client.user.avatarURL() });

                                await msg.edit({
                                    embeds: [embedCoupon],
                                    components: [rowCoupon1, rowCoupon2]
                                });

                                await collectorMsg.stop();
                            };
                        } catch (err) {
                            interaction.reply({ content: `❗ | Ocorreu um erro ao executar essa função.\nErro: ${err}` })
                            return;
                        };
                   };

                    if (valueId == `changeMinimumPurchase`) {
                        const minimumPurchaseC = await dbCoupons.get(`${nameCoupon}.minimumPurchase`);

                        const minimumPurchaseFormatted = minimumPurchaseC != 0
                            ? `${Number(minimumPurchaseC).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}`
                            : `Qualquer valor.`;

                        await msg.edit({
                            embeds: [new EmbedBuilder()
                                .setTitle(`${client.user.username} | Valor Mínimo`)
                                .setDescription(`Envie o valor mínimo de compra que será utilizado! \`(${minimumPurchaseFormatted})\``)
                                .setFooter({ text: `Você tem 2 minutos para enviar.` })
                                .setColor(colorC !== "none" ? colorC : "#460580")
                            ],
                            components: [new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder().setCustomId(`removeMinimumPurchase-${nameCoupon}`).setLabel(`REMOVER`).setEmoji(`<:lixo:1236083085636796416>`).setStyle(`Danger`),
                                    new ButtonBuilder().setCustomId(`previousPageConfigsCoupon-${nameCoupon}`).setLabel(`Voltar`).setEmoji(`⬅`).setStyle(`Secondary`)
                                )
                            ]
                        });

                        const collectorMsg = channelI.createMessageCollector({
                            filter: (m) => m.author.id === interaction.user.id,
                            time: 120000,
                            max: 1
                        });

                        collectorMsg.on("collect", async (m) => {
                            const valor = m.content.replace(",", ".").trim();
                            const numero = Number(valor);

                            if (isNaN(numero) || numero < 0) {
                                return channelI.send("❌ Valor inválido. Tente novamente com um número válido.");
                            }

                            await dbCoupons.set(`${nameCoupon}.minimumPurchase`, numero);
                            await channelI.send(`✅ Valor mínimo atualizado para: ${numero.toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}`);
                        });

                        collectorMsg.on("end", (collected, reason) => {
                            if (reason === "time") {
                                channelI.send("⏰ Tempo esgotado. Nenhum valor foi inserido.");
                            }
                        });
                    }
                }
            });
        });
    }
};