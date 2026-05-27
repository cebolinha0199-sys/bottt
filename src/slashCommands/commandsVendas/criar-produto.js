const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const moment = require("moment");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("criar-produto")
        .setDescription("Cadastre um novo produto!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Produto")
            .setMaxLength(25)
            .setRequired(true)
        ),

    async execute(interaction, client) {
        //let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
        //if (type?.Vendas?.status !== true) {
           // interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
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

        const idProduct = interaction.options.getString("id").replace(/\s/g, "");
    // bloqueie de criar produtos com . ou -
        
        if (idProduct.includes(".") || idProduct.includes("-")) {
            await interaction.reply({
                content: `❌ | ID do produto: **${idProduct}** não pode conter **.** ou **-**.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        if (dbProducts.has(idProduct)) {
            await interaction.reply({
                content: `❌ | ID do produto: **${idProduct}** já existe.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        } else if (!isNaN(idProduct)) {
            interaction.reply({ content: `Seu produto deve ser um texto.` })
        } else {
            const corGeral = await dbConfigs.get('vendas.embeds.color')
            await dbProducts.set(`${idProduct}.id`, idProduct);
            await dbProducts.set(`${idProduct}.name`, `Não configurado(a).`);
            await dbProducts.set(`${idProduct}.description`, "Não configurado(a).");
            await dbProducts.set(`${idProduct}.thumbUrl`, "none");
            await dbProducts.set(`${idProduct}.bannerUrl`, "none");
            await dbProducts.set(`${idProduct}.color`, corGeral);
            await dbProducts.set(`${idProduct}.price`, "10.00");
            await dbProducts.set(`${idProduct}.role`, "none");
            await dbProducts.set(`${idProduct}.useCoupon`, true);
            await dbProducts.set(`${idProduct}.stock`, []);
            await dbProducts.set(`${idProduct}.notificationUsers`, {});
            await dbProducts.set(`${idProduct}.creationData`, moment());

            const nameP = await dbProducts.get(`${idProduct}.name`);
            const descriptionP = await dbProducts.get(`${idProduct}.description`);
            const thumbP = await dbProducts.get(`${idProduct}.thumbUrl`);
            const bannerP = await dbProducts.get(`${idProduct}.bannerUrl`);
            const colorP = await dbProducts.get(`${idProduct}.color`);
            const priceP = await dbProducts.get(`${idProduct}.price`);
            const estoqueP = await dbProducts.get(`${idProduct}.stock`);

            // EMOJIS

            const dinheiroEmoji = `<:dinheiro:${await dbe.get('dinheiro')}>`;
            const caixaEmoji = `<:caixa:${dbe.get('caixa')}>`;
            const userEmoji = `<:user:${dbe.get('user')}>`;
            const estrelaEmoji = `<a:estrela:${dbe.get('estrela')}>`;
            const calendarioEmoji = `<:calendario:${dbe.get('calendario')}>`;
            const umEmoji = `<:um:${dbe.get('um')}>`;
            const doisEmoji = `<:dois:${dbe.get('dois')}>`;
            const tresEmoji = `<:tres:${dbe.get('tres')}>`;
            const quatroEmoji = `<:quatro:${dbe.get('quatro')}>`;
            const cincoEmoji = `<:cinco:${dbe.get('cinco')}>`;
            const seisEmoji = `<:seis:${dbe.get('seis')}>`;
            const seteEmoji = `<:sete:${dbe.get('sete')}>`;
            const oitoEmoji = `<:oito:${dbe.get('oito')}>`;
            const suporteEmoji = `<:suporte:${dbe.get('suporte')}>`;

            const thumbC = await dbConfigs.get(`vendas.images.thumbUrl`);
            const bannerC = await dbConfigs.get(`vendas.images.bannerUrl`);

            const buttonDuvidas = await dbConfigs.get(`buttonDuvidas`);

            const embedProduct = new EmbedBuilder()
                .setAuthor({ name: `${nameP}` })
                .setDescription(`
                    ${umEmoji}${doisEmoji}${tresEmoji}${quatroEmoji}${cincoEmoji}${seisEmoji}${seteEmoji}${oitoEmoji}\n\n${descriptionP}
                    `)
                .addFields(
                    { name: `Valor à vista`, value: `\`${Number(priceP).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                    { name: `Restam`, value: `\`${estoqueP.length}\``, inline: true }
                )
                .setThumbnail(thumbP !== "none" ? thumbP : thumbC !== "none" ? thumbC : "https://sem-img.com")
                .setImage(bannerP !== "none" ? bannerP : bannerC !== "none" ? bannerC : "https://sem-img.com")
                .setColor(colorP != "none" ? colorP : "#460580")

            if (buttonDuvidas !== "none") {
                const msg = await interaction.channel.send({
                    content: ``,
                    embeds: [embedProduct],
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId(idProduct).setLabel(`Comprar`).setEmoji(`<:carrinho:1236021394610061352>`).setStyle(`Success`),
                                new ButtonBuilder().setURL(`https://discord.com/channels/${interaction.guild.id}/${buttonDuvidas}`).setLabel(`Dúvidas`).setEmoji(`${suporteEmoji}`).setStyle(`Link`)
                            )
                    ]
                });
                await dbProducts.set(`${idProduct}.msgLocalization.channelId`, interaction.channel.id);
                await dbProducts.set(`${idProduct}.msgLocalization.messageId`, msg.id);
            } else {
                const msg = await interaction.channel.send({
                    content: ``,
                    embeds: [embedProduct],
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId(idProduct).setLabel(`Comprar`).setEmoji(`<:carrinho:1236021394610061352>`).setStyle(`Success`)
                            )
                    ]
                })
                await dbProducts.set(`${idProduct}.msgLocalization.channelId`, interaction.channel.id);
                await dbProducts.set(`${idProduct}.msgLocalization.messageId`, msg.id);
            }

            await interaction.reply({
                content: `✅ | Produto criado com sucesso. Utilize **/config-produto** para gerenciar seu produto!`,
                flags: MessageFlags.Ephemeral
            });
        }
    },
};