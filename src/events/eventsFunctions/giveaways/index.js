const { createGiveawayModal, handleGiveawayModalSubmit } = require('./createGiveaway');
const { handleParticipateButton } = require('./participateGiveaway');
const { handleListParticipantsButton } = require('./listParticipants');
const { setupGiveawayEnding, finalizarSorteio, forcarFinalizacaoSorteio } = require('./endGiveaway');
const { loadGiveaways, permitirAutoParticipacao, verificarIntegridadeSorteios } = require('./utils');


function initGiveawaySystem(client) {
    //console.log('Inicializando sistema de sorteios...');
    
    try {
        // Verificar integridade do sistema
        verificarIntegridadeSorteios(client);
        
        // Carregar sorteios existentes e configurar timers para finalização
        const giveaways = loadGiveaways();
        
        //console.log(`Carregados ${giveaways.giveaways.length} sorteios do banco de dados`);
        
        for (const giveaway of giveaways.giveaways) {
            try {
                if (!giveaway.ended && giveaway.endAt > Date.now()) {
                    //console.log(`Configurando temporizador para o sorteio: ${giveaway.prize}`);
                    setupGiveawayEnding(client, giveaway);
                } else if (!giveaway.ended && giveaway.endAt <= Date.now()) {
                    //console.log(`Sorteio ${giveaway.prize} já deveria ter terminado. Finalizando agora...`);
                    // Agendar para finalizar com um pequeno delay para evitar sobrecarga
                    setTimeout(() => {
                        finalizarSorteio(client, giveaway);
                    }, 20000);
                }
            } catch (giveawayError) {
                console.error(`Erro ao processar sorteio ${giveaway.messageId}:`, giveawayError);
                // Continua para o próximo sorteio mesmo com erro
            }
        }

        // Registrar listeners para eventos relacionados a sorteios
        client.on('interactionCreate', async (interaction) => {
            try {
                // Botão para abrir modal de criação de sorteio
                if (interaction.isButton() && interaction.customId === 'configSorteio') {
                    await createGiveawayModal(interaction);
                }

                // Submissão do modal de criação de sorteio
                if (interaction.isModalSubmit() && interaction.customId === 'sorteioModal') {
                    await handleGiveawayModalSubmit(client, interaction);
                }

                // Botão para participar do sorteio
                if (interaction.isButton() && interaction.customId.startsWith('participar_')) {
                    await handleParticipateButton(interaction);
                }

                // Botão para listar participantes
                if (interaction.isButton() && interaction.customId.startsWith('lista_')) {
                    await handleListParticipantsButton(interaction);
                }
            } catch (interactionError) {
                console.error('Erro ao processar interação:', interactionError);
                // Tentar responder ao usuário sobre o erro, se possível
                if (interaction.isRepliable() && !interaction.replied) {
                    try {
                        await interaction.reply({
                            content: '❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.',
                            ephemeral: true
                        });
                    } catch (replyError) {
                        console.error('Erro ao responder após erro de interação:', replyError);
                    }
                }
            }
        });

        //console.log('✅ Sistema de sorteios inicializado com sucesso!');

        // Configurar verificação periódica de integridade (a cada 30 minutos)
        setInterval(() => {
            try {
                verificarIntegridadeSorteios(client);
            } catch (error) {
                console.error('Erro na verificação periódica de integridade:', error);
            }
        }, 30 * 60 * 1000);
        
        return true;
    } catch (error) {
        console.error('❌ Erro crítico ao inicializar sistema de sorteios:', error);
        return false;
    }
}

module.exports = {
    initGiveawaySystem,
    forcarFinalizacaoSorteio,
    permitirAutoParticipacao
};