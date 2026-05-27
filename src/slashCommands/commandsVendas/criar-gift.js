const { MessageFlags, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbGifts = new JsonDatabase({ databasePath: "./databases/dbGifts.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("criar-gift")
        .setDescription("Cadastre um novo GiftCard com valor!")
        .addIntegerOption(opInteger => opInteger
            .setName(`valor`)
            .setDescription(`Valor que será resgatado no gift`)
            .setMinValue(1)
            .setRequired(true)
        ),

    async execute(interaction, client) {
     //   let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
    //    if (type?.Vendas?.status !== true) {
    //        interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
    //        return
    //    }

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

        const valueInserted = interaction.options.getInteger(`valor`);

        if (Number(valueInserted) <= 0) {
            await interaction.reply({
                content: `❌ | O valor mínimo é de **R$1**.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        const giftCode = generateRandomCode(18);

        await dbGifts.set(`${giftCode}.balance`, Number(valueInserted));

        const embedGiftcard = new EmbedBuilder()
            .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
            .setTitle(`${client.user.username} | Gift Criado`)
            .addFields(
                { name: `🎁 | Código:`, value: `${giftCode}` },
                { name: `💰 | Valor:`, value: `R$__${Number(valueInserted).toFixed(2)}__` }
            )
            .setColor(`Green`)
            .setFooter({ text: `Utilize (/criados) para visualizar todos os giftcards existentes.` });

        await interaction.reply({
            embeds: [embedGiftcard],
            flags: MessageFlags.Ephemeral
        });

        function generateRandomCode(length) {
            let result = ``;
            const characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;
            const charactersLength = characters.length;

            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            };
            return result;
        };
    },
};