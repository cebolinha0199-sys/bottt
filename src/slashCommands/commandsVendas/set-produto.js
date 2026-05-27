const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");

const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-produto")
        .setDescription("Envie a mensagem de compra!")
        .addStringOption(opString => opString
            .setName("id")
            .setDescription("ID do Produto")
            .setMaxLength(25)
            .setAutocomplete(true)
            .setRequired(true)
        ),

    async autocomplete(interaction) {
        const choices = [];
        const dono = getCache(null, "owner");

        // Verificação de permissão comentada
        /*
        const type = getCache(null, 'type');
        if (type?.Vendas?.status !== true) {
            choices.push({
                name: "❌ | Comando desabilitado pois o bot não possui o sistema de venda adquirido.",
                value: "no-perms"
            });
            await interaction.respond(choices);
            return;
        }
        */

        // ✅ Correção principal: await dbProducts.all()
        const products = await dbProducts.all();
        for (const product of products) {
            choices.push({
                name: `ID: ${product.ID} | Nome: ${product.data.name}`,
                value: product.ID,
            });
        }

        // Ordena por ID
        choices.sort((a, b) => a.value.localeCompare(b.value));

        const searchId = interaction.options.getString("id");
        const filtered = searchId
            ? choices.filter(c => c.name.toLowerCase().includes(searchId.toLowerCase()))
            : choices.slice(0, 25);

        await interaction.respond(filtered);
    },

    async execute(interaction, client) {
        const dono = getCache(null, "owner");

        const isInDb = (await dbPerms.get("vendas"))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isInDb && !isOwner) {
            await interaction.reply({
                content: "❌ | Você não tem permissão para usar este comando!",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const idProduct = interaction.options.getString("id");

        if (!dbProducts.has(idProduct)) {
            await interaction.reply({
                content: `❌ | ID do produto: **${idProduct}** não foi encontrado.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const nameP = await dbProducts.get(`${idProduct}.name`);
        const descriptionP = await dbProducts.get(`${idProduct}.description`);
        const thumbP = await dbProducts.get(`${idProduct}.thumbUrl`);
        const bannerP = await dbProducts.get(`${idProduct}.bannerUrl`);
        const colorP = await dbProducts.get(`${idProduct}.color`);
        const priceP = await dbProducts.get(`${idProduct}.price`);
        const estoqueP = await dbProducts.get(`${idProduct}.stock`);

        // Emojis (pode transformar em função depois se quiser simplificar)
        const getEmoji = async (key) => `<:${key}:${await dbe.get(key) || "0"}>`;
        const getAEmoji = async (key) => `<a:${key}:${await dbe.get(key) || "0"}>`;

        const umEmoji = await getEmoji('um');
        const doisEmoji = await getEmoji('dois');
        const tresEmoji = await getEmoji('tres');
        const quatroEmoji = await getEmoji('quatro');
        const cincoEmoji = await getEmoji('cinco');
        const seisEmoji = await getEmoji('seis');
        const seteEmoji = await getEmoji('sete');
        const oitoEmoji = await getEmoji('oito');
        const suporteEmoji = await getEmoji('suporte');

        const carrinhoEmoji = await getEmoji('carrinho');

        const thumbC = await dbConfigs.get(`vendas.images.thumbUrl`);
        const bannerC = await dbConfigs.get(`vendas.images.bannerUrl`);
        const colorC = await dbConfigs.get(`vendas.embeds.color`);
        const buttonDuvidas = await dbConfigs.get(`buttonDuvidas`);

        const embedProduct = new EmbedBuilder()
            .setAuthor({ name: nameP })
            .setDescription(`${umEmoji}${doisEmoji}${tresEmoji}${quatroEmoji}${cincoEmoji}${seisEmoji}${seteEmoji}${oitoEmoji}\n\n${descriptionP}`)
            .addFields(
                { name: `Valor à vista`, value: `\`${Number(priceP).toLocaleString(global.lenguage.um, { style: 'currency', currency: global.lenguage.dois })}\``, inline: true },
                { name: `Restam`, value: `\`${estoqueP.length}\``, inline: true }
            )
            .setThumbnail(thumbP !== "none" ? thumbP : (thumbC !== "none" ? thumbC : "https://sem-img.com"))
            .setImage(bannerP !== "none" ? bannerP : (bannerC !== "none" ? bannerC : "https://sem-img.com"))
            .setColor(colorP !== "none" ? colorP : (colorC !== "none" ? colorC : "#460580"));

        const buttons = [
            new ButtonBuilder()
                .setCustomId(idProduct)
                .setLabel("Comprar")
                .setEmoji(carrinhoEmoji)
                .setStyle("Success")
        ];

        if (buttonDuvidas !== "none") {
            buttons.push(
                new ButtonBuilder()
                    .setURL(`https://discord.com/channels/${interaction.guild.id}/${buttonDuvidas}`)
                    .setLabel("Dúvidas")
                    .setEmoji(suporteEmoji)
                    .setStyle("Link")
            );
        }

        const msg = await interaction.channel.send({
            embeds: [embedProduct],
            components: [new ActionRowBuilder().addComponents(buttons)]
        });

        await dbProducts.set(`${idProduct}.msgLocalization.channelId`, interaction.channel.id);
        await dbProducts.set(`${idProduct}.msgLocalization.messageId`, msg.id);

        await interaction.reply({
            content: `✅ | Produto setado com sucesso no canal: ${interaction.channel}.`,
            flags: MessageFlags.Ephemeral
        });
    },
};