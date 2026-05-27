const {
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionType
} = require("discord.js");
const { JsonDatabase } = require("wio.db");
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });


module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        // Ignorar mensagens de bots para evitar loops
        if (message.author.bot) return;

        try {
            // Buscar reações automáticas configuradas
            const reacoesAutomaticas = dbConfigs.get(`vendas.reacoes.automaticas`) || [];

            // Verificar se há alguma reação configurada para este canal
            const reacoesCanalAtual = reacoesAutomaticas.filter(reacao => reacao.canalId === message.channel.id);

            // Se houver reações configuradas, adicionar cada uma
            for (const reacao of reacoesCanalAtual) {
                try {
                    await message.react(reacao.emoji);
                    console.log(`Reação automática "${reacao.id}" aplicada com emoji ${reacao.emoji} em mensagem no canal ${message.channel.name}`);
                } catch (error) {
                    console.error(`Erro ao aplicar reação automática "${reacao.id}" com emoji ${reacao.emoji}:`, error);
                }
            }
        } catch (error) {
            console.error("Erro no evento messageCreate ao processar reações automáticas:", error);
        }
    }
};