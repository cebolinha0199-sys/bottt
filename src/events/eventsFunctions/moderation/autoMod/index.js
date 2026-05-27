const { Events } = require('discord.js');
const { loadConfig } = require('../config/loadConfig');
const spamDetection = require('./spamDetection');
const linkFilter = require('./linkFilter');
const mentionSpamFilter = require('./mentionSpamFilter');

function init(client) {
    // Verificar se o cliente está pronto
    if (!client.isReady()) {
        console.error('Cliente Discord não está pronto!');
        return;
    }

    console.log('Iniciando sistema de Auto-Moderação...');

    client.on(Events.MessageCreate, async (message) => {
        try {
            // Verificações iniciais com logs
            if (message.author.bot) {
                return;
            }

            if (!message.guild) {
                return;
            }

            // Verificar permissões do bot
            const botMember = message.guild.members.cache.get(client.user.id);
            if (!botMember) {
                console.error('Erro: Não foi possível encontrar o bot no servidor');
                return;
            }

            const requiredPermissions = [
                'ManageMessages',
                'ModerateMembers',
                'BanMembers',
                'KickMembers'
            ];

            const missingPermissions = requiredPermissions.filter(perm => !botMember.permissions.has(perm));
            if (missingPermissions.length > 0) {
                return;
            }

            // Carregar configuração com verificação
            const guildConfig = await loadConfig(message.guild.id);

            if (!guildConfig) {
                return;
            }

            // Verificar se o Auto-Moderador está ativado
            if (!guildConfig.autoMod?.enabled) {
                return;
            }

            // Executar verificações
            const checks = [
                {
                    name: 'Spam Detection',
                    enabled: guildConfig.autoMod.spamDetection?.enabled,
                    handler: async () => await spamDetection.checkMessage(message, guildConfig)
                },
                {
                    name: 'Link Filter',
                    enabled: guildConfig.autoMod.linkFilter?.enabled,
                    handler: async () => await linkFilter.checkMessage(message, guildConfig)
                },
                {
                    name: 'Mention Filter',
                    enabled: guildConfig.autoMod.mentionFilter?.enabled,
                    handler: async () => await mentionSpamFilter.checkMessage(message, guildConfig)
                }
            ];

            // Executar cada verificação
            for (const check of checks) {
                if (check.enabled) {
                    try {
                        await check.handler();
                    } catch (err) {
                        console.error(`Erro em ${check.name}:`, err);
                    }
                } else {
                    console.log(`${check.name} desativado`);
                }
            }

        } catch (error) {
            console.error('Erro processando mensagem:', error);
        }
    });

    // Adicionar listener para erros não tratados
    process.on('unhandledRejection', (error) => {
        console.error('Unhandled promise rejection:', error);
    });

    console.log('Sistema de Auto-Moderação inicializado com sucesso!');
}

// Função auxiliar para validar configuração
function validateConfig(guildConfig) {
    const required = [
        'autoMod.enabled',
        'autoMod.spamDetection',
        'autoMod.linkFilter',
        'autoMod.mentionFilter'
    ];

    const missing = required.filter(path => {
        const parts = path.split('.');
        let current = guildConfig;
        for (const part of parts) {
            if (current[part] === undefined) return true;
            current = current[part];
        }
        return false;
    });

    if (missing.length > 0) {
        console.error(`Configuração inválida. Campos ausentes: ${missing.join(', ')}`);
        return false;
    }

    return true;
}

module.exports = { init };
