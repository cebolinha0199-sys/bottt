const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { JsonDatabase } = require("wio.db");

const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });

module.exports = {
    name: "guildMemberAdd",
    async execute(member, client) {
        //console.log("Novo membro detectado");
        try {
            const channelaasdawdw = dbConfigs.get(`vendas.welcome.channelid`) || [];
            const gggg = dbConfigs.get(`vendas.welcome.msg`) || "Seja bem-vindo(a) {member} ao servidor {guildname}!";
            const cargoId = dbConfigs.get(`vendas.welcome.cargoId`);

            // Adicionar o cargo ao membro, se um ID de cargo válido foi configurado
            if (cargoId) {
                try {
                    const cargo = member.guild.roles.cache.get(cargoId);
                    if (cargo) {
                        await member.roles.add(cargo);
                        //(`Cargo ${cargo.name} adicionado ao membro ${member.user.tag}`);
                    } else {
                        console.log(`Cargo com ID ${cargoId} não encontrado no servidor`);
                    }
                } catch (error) {
                    console.error("Erro ao adicionar cargo:", error);
                }
            }  

            const mapeamentoSubstituicao = {
                "{member}": `<@${member.user.id}>`,
                "{guildname}": `${member.guild.name}`
            };

            const substituirPalavras = (match) => mapeamentoSubstituicao[match] || match;
            const stringNova = gggg.replace(/{member}|{guildname}/g, substituirPalavras);

            const row222 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('asSs')
                        .setLabel('Mensagem do Sistema')
                        .setStyle(2)
                        .setDisabled(true)
                );

            channelaasdawdw.forEach(async element => {
                try {
                    const channela = client.channels.cache.get(element);
                    if (channela) {
                        await channela.send({ components: [row222], content: `${stringNova}` }).then(msg => {
                            const tempo = dbConfigs.get(`vendas.welcome.tempo`) || 60;
                            setTimeout(() => {
                                try {
                                    msg.delete();
                                } catch (error) {
                                    console.error("Erro ao deletar mensagem:", error);
                                }
                            }, tempo * 1000);
                        });
                    }
                } catch (error) {
                    console.error(`Erro ao enviar mensagem no canal ${element}:`, error);
                }
            });

        } catch (error) {
            console.error("Erro no evento guildMemberAdd: ", error);
        }
    }
};