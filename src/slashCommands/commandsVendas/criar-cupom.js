const { MessageFlags, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbCoupons = new JsonDatabase({ databasePath: "./databases/dbCoupons.json" });
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });

module.exports = {
    data: new SlashCommandBuilder()
        .setName("criar-cupom")
        .setDescription("Cadastre um novo cupom de desconto!")
        .addStringOption(opString => opString
            .setName("nome")
            .setDescription("Nome do Cupom")
            .setMaxLength(25)
            .setRequired(true)
        )
        .addIntegerOption(opInteger => opInteger
            .setName("porcentagem")
            .setDescription("Porcentagem do Desconto (Ex: 50%)")
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true)
        )
        .addIntegerOption(opInteger => opInteger
            .setName("quantidade")
            .setDescription("Quantidade de usos do Cupom (Ex: 25)")
            .setMinValue(1)
            .setMaxValue(10000)
            .setRequired(true)
        ),

    async execute(interaction, client) {
    //    let type = getCache(null, 'type')
        let dono = getCache(null, "owner")
     //   if (type?.Vendas?.status !== true) {
            //interaction.reply({ content: `❌ | Você não possui acesso a nosso sistema de **VENDAS**, adquira um em nosso discord utilizando **/renovar**. [CLIQUE AQUI](https://discord.com/channels/1289642313412251780/1289642314096054361) para ser redirecionado.`, flags: MessageFlags.Ephemeral })
           // return
     //   }

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

        const nameCoupon = interaction.options.getString("nome").replace(/\s/g, "").toLowerCase();
        const percentageCoupon = interaction.options.getInteger("porcentagem");
        const quantityCoupon = interaction.options.getInteger("quantidade");

        if (dbCoupons.has(nameCoupon)) {
            await interaction.reply({
                content: `❌ | ID do cupom: **${nameCoupon}** já existe.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        };

        await dbCoupons.set(`${nameCoupon}.name`, nameCoupon);
        await dbCoupons.set(`${nameCoupon}.discount`, percentageCoupon);
        await dbCoupons.set(`${nameCoupon}.stock`, quantityCoupon);
        await dbCoupons.set(`${nameCoupon}.role`, `none`);
        await dbCoupons.set(`${nameCoupon}.minimumPurchase`, 0);

        await interaction.reply({
            content: `✅ | Cupom de desconto criado com sucesso. Use **/config-cupom** para gerenciar seu cupom!`,
            flags: MessageFlags.Ephemeral
        });
    },
};