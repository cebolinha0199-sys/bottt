const { MessageFlags, EmbedBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders")
const { JsonDatabase } = require("wio.db");
const { getCache } = require("../../../Functions/connect_api");
const dbProfiles = new JsonDatabase({ databasePath: "./databases/dbProfiles.json" })
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })

module.exports = {
    data: new SlashCommandBuilder()
        .setName("administrar-saldo")
        .setDescription("Gerencie o saldo de algum usuário!")
        .addStringOption(opString => opString
            .setName("ação")
            .setDescription("Selecione o Tipo de Ação")
            .addChoices(
                { name: "Adicionar", value: "add" },
                { name: "Remover", value: "remove" }
            )
            .setRequired(true)
        )
        .addUserOption(opUser => opUser
            .setName("usuário")
            .setDescription("Usuário que terá o saldo gerenciado")
            .setRequired(true)
        )
        .addNumberOption(opInteger => opInteger
            .setName("valor")
            .setDescription("Insirá o valor que será adicionado ou removido")
            .setMinValue(0.01)
            .setRequired(true)
        ),

    async execute(interaction, client) {
        let dono = getCache(null, "owner")

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

        const actionSelected = interaction.options.getString("ação")
        const userSelected = interaction.options.getUser("usuário")
        const valueInserted = interaction.options.getNumber("valor")

        if (Number(valueInserted) <= 0) {
            await interaction.reply({
                content: `❌ | O valor mínimo é de **R$__0,01__**!`,
                flags: MessageFlags.Ephemeral
            })
            return;
        }

        if (actionSelected == `add`) {
            await dbProfiles.add(`${userSelected.id}.balance`, Number(valueInserted).toFixed(2))
            const userBalance = await dbProfiles.get(`${userSelected.id}.balance`)
            await interaction.reply({
                content: `✅ | Foram adicionados **R$__${Number(valueInserted).toFixed(2)}__** no usuário ${userSelected}. Agora ele tem **R$__${Number(userBalance).toFixed(2)}__** no total.`,
                flags: MessageFlags.Ephemeral
            })

        } else if (actionSelected == "remove") {
            const userBalanceBefore = await dbProfiles.get(`${userSelected.id}.balance`)
            if (Number(userBalanceBefore) <= 0) {
                await interaction.reply({
                    content: `❌ | O usuário ${userSelected} não tem saldo suficiente para ser removido.`,
                    flags: MessageFlags.Ephemeral
                })
                return;
            }
            await dbProfiles.substr(`${userSelected.id}.balance`, Number(valueInserted))
            const userBalanceAfter = await dbProfiles.get(`${userSelected.id}.balance`)
            await interaction.reply({
                content: `✅ | Foram removidos **R$__${Number(valueInserted).toFixed(2)}__** do usuário ${userSelected}. Agora ele tem **R$__${Number(userBalanceAfter).toFixed(2)}__** no total.`,
                flags: MessageFlags.Ephemeral
            })
        }
    },
}