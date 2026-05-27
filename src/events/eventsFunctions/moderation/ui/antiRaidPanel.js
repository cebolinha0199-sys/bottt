const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { saveConfig } = require('../config/saveConfig');


async function handleInteraction(interaction, client, guildConfig) {
    try {
        // Logging para debug
        //console.log('Interação recebida:', interaction.customId);

        // Switch case para todos os tipos de interação
        switch (interaction.customId) {
            case 'mod_antiraid_panel':
                await showAntiRaidPanel(interaction, guildConfig);
                break;

            case 'mod_antiraid_toggle':
                const botRole = interaction.guild.members.me.roles.highest;
                const highestRole = interaction.guild.roles.highest;
                if (botRole.position < highestRole.position) {
                    await interaction.reply({
                        content: '❌ Não posso ativar o sistema Anti-Raid, pois meu cargo é menor que o cargo mais alto do servidor.',
                        ephemeral: true
                    });
                    return;
                }
                await toggleAntiRaid(interaction, guildConfig);
                break;

            // Proteção de Canais
            case 'mod_antiraid_channel_protection':
                await configureChannelProtection(interaction, guildConfig);
                break;
            case 'mod_antiraid_channel_toggle':
                
                await toggleChannelProtection(interaction, guildConfig);
                break;

            // Proteção de Cargos
            case 'mod_antiraid_role_protection':
                await configureRoleProtection(interaction, guildConfig);
                break;
            case 'mod_antiraid_role_toggle':
                await toggleRoleProtection(interaction, guildConfig);
                break;

            // Proteção contra Banimentos
            case 'mod_antiraid_ban_protection':
                await configureBanProtection(interaction, guildConfig);
                break;
            case 'mod_antiraid_ban_toggle':
                await toggleBanProtection(interaction, guildConfig);
                break;

            // Proteção contra Expulsões
            case 'mod_antiraid_kick_protection':
                await configureKickProtection(interaction, guildConfig);
                break;
            case 'mod_antiraid_kick_toggle':
                await toggleKickProtection(interaction, guildConfig);
                break;
        }

        // Handler para menus de seleção
        if (interaction.isStringSelectMenu()) {
            switch (interaction.customId) {
                case 'mod_antiraid_channel_action':
                    await handleChannelActionSelect(interaction, guildConfig);
                    break;
                case 'mod_antiraid_role_action':
                    await handleRoleActionSelect(interaction, guildConfig);
                    break;
                case 'mod_antiraid_ban_action':
                    await handleBanActionSelect(interaction, guildConfig);
                    break;
                case 'mod_antiraid_ban_threshold':
                    await handleBanThresholdSelect(interaction, guildConfig);
                    break;
                case 'mod_antiraid_kick_action':
                    await handleKickActionSelect(interaction, guildConfig);
                    break;
                case 'mod_antiraid_kick_threshold':
                    await handleKickThresholdSelect(interaction, guildConfig);
                    break;
            }
        }

    } catch (error) {
        console.error('Erro ao processar interação:', error);
        await handleError(interaction, error);
    }
}



async function showAntiRaidPanel(interaction, guildConfig) {
    // Inicializar configuração se não existir
    if (!guildConfig.antiRaid) {
        guildConfig.antiRaid = {
            enabled: false,
            channelProtection: { enabled: false, action: 'removePermissions' },
            roleProtection: { enabled: false, action: 'removePermissions' },
            banProtection: { enabled: false, action: 'ban', threshold: 5 },
            kickProtection: { enabled: false, action: 'removePermissions', threshold: 5 }
        };
        await saveConfig(interaction.guild.id, guildConfig);
    }

    const embed = new EmbedBuilder()
        .setTitle('🔒 Configuração do Sistema Anti-Raid')
        .setDescription('Configure as proteções contra ações maliciosas em seu servidor.')
        .setColor('#FF3333')
        .addFields(
            {
                name: '📊 Status Atual',
                value: guildConfig.antiRaid.enabled ? 'Sistema Anti-Raid está **ATIVADO**' : 'Sistema Anti-Raid está **DESATIVADO**',
                inline: false
            },
            {
                name: '🔧 Proteções Disponíveis',
                value: 'Configure cada tipo de proteção individualmente:',
                inline: false
            },
            {
                name: '📺 Proteção de Canais',
                value: `Status: ${guildConfig.antiRaid.channelProtection.enabled ? '✅ Ativado' : '❌ Desativado'}\nAção: ${getActionName(guildConfig.antiRaid.channelProtection.action)}`,
                inline: true
            },
            {
                name: '🏷️ Proteção de Cargos',
                value: `Status: ${guildConfig.antiRaid.roleProtection.enabled ? '✅ Ativado' : '❌ Desativado'}\nAção: ${getActionName(guildConfig.antiRaid.roleProtection.action)}`,
                inline: true
            },
            {
                name: '🔨 Proteção contra Banimentos',
                value: `Status: ${guildConfig.antiRaid.banProtection.enabled ? '✅ Ativado' : '❌ Desativado'}\nAção: ${getActionName(guildConfig.antiRaid.banProtection.action)}\nLimite: ${guildConfig.antiRaid.banProtection.threshold} banimentos`,
                inline: true
            },
            {
                name: '👢 Proteção contra Expulsões',
                value: `Status: ${guildConfig.antiRaid.kickProtection.enabled ? '✅ Ativado' : '❌ Desativado'}\nAção: ${getActionName(guildConfig.antiRaid.kickProtection.action)}\nLimite: ${guildConfig.antiRaid.kickProtection.threshold} expulsões`,
                inline: true
            }
        );

    // const row1 = new ActionRowBuilder().addComponents(
    //     new ButtonBuilder()
    //         .setCustomId('mod_antiraid_toggle')
    //         .setLabel(guildConfig.antiRaid.enabled ? 'Desativar Sistema' : 'Ativar Sistema')
    //         .setStyle(guildConfig.antiRaid.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
    //         .setEmoji(guildConfig.antiRaid.enabled ? '<:lockalt:1365941662022504530>' : '<:lockalt:1365941662022504530>'),
    // );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_antiraid_channel_protection')
            .setLabel('Proteção de Canais')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:1289362293456633942:1364987313750282251>'),
        new ButtonBuilder()
            .setCustomId('mod_antiraid_role_protection')
            .setLabel('Proteção de Cargos')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:at:1365940208389980251>')
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_antiraid_ban_protection')
            .setLabel('Proteção contra Banimentos')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:Report_NeverMiss:1365940951922774126>'),
        new ButtonBuilder()
            .setCustomId('mod_antiraid_kick_protection')
            .setLabel('Proteção contra Expulsões')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:1289361467912618077:1364987310554349639>')
    );

    const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('configModeracao')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>'),
        new ButtonBuilder()
            .setCustomId('mod_antiraid_toggle')
            .setLabel(guildConfig.antiRaid.enabled ? 'Desativar Sistema' : 'Ativar Sistema')
            .setStyle(guildConfig.antiRaid.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(guildConfig.antiRaid.enabled ? '<:lockopenalt:1365941664199217204>' : '<:lockalt:1365941662022504530>')
    );

    await interaction.update({
        embeds: [embed],
        components: [row2, row3, row4],
        ephemeral: true
    });
}


async function toggleAntiRaid(interaction, guildConfig) {
    guildConfig.antiRaid.enabled = !guildConfig.antiRaid.enabled;
    await saveConfig(interaction.guild.id, guildConfig);

    await showAntiRaidPanel(interaction, guildConfig);
}


async function configureRoleProtection(interaction, guildConfig) {
    try {
        // Criar embed informativo
        const embed = new EmbedBuilder()
            .setTitle('🏷️ Configuração de Proteção de Cargos')
            .setDescription('Configure como o sistema deve reagir quando alguém tentar excluir ou modificar cargos em massa.')
            .setColor('#3498DB')
            .addFields(
                {
                    name: '📊 Status Atual',
                    value: guildConfig.antiRaid.roleProtection.enabled ? 'Proteção está **ATIVADA**' : 'Proteção está **DESATIVADA**',
                    inline: false
                },
                {
                    name: '🔧 Ação Atual',
                    value: `Quando detectar exclusão de cargos: **${getActionName(guildConfig.antiRaid.roleProtection.action)}**`,
                    inline: false
                }
            );

        // Criar botões de ação
        const toggleButton = new ButtonBuilder()
            .setCustomId('mod_antiraid_role_toggle')
            .setLabel(guildConfig.antiRaid.roleProtection.enabled ? 'Desativar Proteção' : 'Ativar Proteção')
            .setStyle(guildConfig.antiRaid.roleProtection.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(guildConfig.antiRaid.roleProtection.enabled ? '<:lockalt:1365941662022504530>' : '<:lockalt:1365941662022504530>');

        const backButton = new ButtonBuilder()
            .setCustomId('mod_antiraid_panel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>');

        // Criar select menu de ações
        const actionSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_antiraid_role_action')
            .setPlaceholder('Selecione a ação a ser tomada')
            .addOptions([
                { 
                    label: 'Remover Permissões', 
                    description: 'Remove todas as permissões administrativas do usuário', 
                    value: 'removePermissions', 
                    emoji: '<:lockalt:1365941662022504530>' 
                },
                { 
                    label: 'Banir Usuário', 
                    description: 'Bane o usuário do servidor', 
                    value: 'ban', 
                    emoji: '🔨' 
                },
                { 
                    label: 'Expulsar Usuário', 
                    description: 'Expulsa o usuário do servidor', 
                    value: 'kick', 
                    emoji: '👢' 
                },
                { 
                    label: 'Remover Todos os Cargos', 
                    description: 'Remove todos os cargos do usuário', 
                    value: 'removeRoles', 
                    emoji: '🏷️' 
                }
            ]);

        // Organizar componentes em rows
        const row1 = new ActionRowBuilder().addComponents(actionSelect);
        const row2 = new ActionRowBuilder().addComponents(toggleButton, backButton); // Botões lado a lado

        // Atualizar interface com tratamento adequado do estado da interação
        const updateOptions = {
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.update(updateOptions);
        } else {
            await interaction.update(updateOptions);
        }

    } catch (error) {
        console.error('Erro ao configurar proteção de cargos:', error);
        
        // Tratamento de erro aprimorado
        const errorRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('mod_antiraid_panel')
                .setLabel('Voltar')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('<:voltar:1365849508059287633>')
        );

        const errorResponse = {
            content: '❌ Ocorreu um erro ao configurar a proteção de cargos. Por favor, tente novamente.',
            components: [errorRow],
            ephemeral: true
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(errorResponse);
        } else {
            await interaction.update(errorResponse);
        }
    }
}


async function configureBanProtection(interaction, guildConfig) {
    try {
        const embed = new EmbedBuilder()
            .setTitle('🔨 Configuração de Proteção contra Banimentos')
            .setDescription('Configure como o sistema deve reagir quando alguém tentar banir membros em massa.')
            .setColor('#3498DB')
            .addFields(
                {
                    name: '📊 Status Atual',
                    value: guildConfig.antiRaid.banProtection.enabled ? 'Proteção está **ATIVADA**' : 'Proteção está **DESATIVADA**',
                    inline: false
                },
                {
                    name: '🔧 Configurações Atuais',
                    value: `Ação: **${getActionName(guildConfig.antiRaid.banProtection.action)}**\nLimite: **${guildConfig.antiRaid.banProtection.threshold}** banimentos em 1 minuto`,
                    inline: false
                }
            );

        const toggleButton = new ButtonBuilder()
            .setCustomId('mod_antiraid_ban_toggle')
            .setLabel(guildConfig.antiRaid.banProtection.enabled ? 'Desativar Proteção' : 'Ativar Proteção')
            .setStyle(guildConfig.antiRaid.banProtection.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(guildConfig.antiRaid.banProtection.enabled ? '<:lockalt:1365941662022504530>' : '<:lockalt:1365941662022504530>');

        const backButton = new ButtonBuilder()
            .setCustomId('mod_antiraid_panel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>');

        const actionSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_antiraid_ban_action')
            .setPlaceholder('Selecione a ação a ser tomada')
            .addOptions([
                { label: 'Banir Usuário', description: 'Bane o usuário do servidor', value: 'ban', emoji: '🔨' },
                { label: 'Remover Permissões', description: 'Remove todas as permissões administrativas do usuário', value: 'removePermissions', emoji: '<:lockalt:1365941662022504530>' },
                { label: 'Remover Todos os Cargos', description: 'Remove todos os cargos do usuário', value: 'removeRoles', emoji: '🏷️' }
            ]);

        const thresholdSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_antiraid_ban_threshold')
            .setPlaceholder('Selecione o limite de banimentos')
            .addOptions([
                { label: '3 banimentos', value: '3', emoji: '3️⃣' },
                { label: '5 banimentos', value: '5', emoji: '5️⃣' },
                { label: '7 banimentos', value: '7', emoji: '7️⃣' },
                { label: '10 banimentos', value: '10', emoji: '🔟' }
            ]);

        const row1 = new ActionRowBuilder().addComponents(actionSelect);
        const row2 = new ActionRowBuilder().addComponents(thresholdSelect);
        const row3 = new ActionRowBuilder().addComponents(toggleButton, backButton); // Botões juntos na mesma row

        if (interaction.deferred || interaction.replied) {
            await interaction.update({
                embeds: [embed],
                components: [row1, row2, row3]
            });
        } else {
            await interaction.update({
                embeds: [embed],
                components: [row1, row2, row3],
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Erro ao configurar proteção contra banimentos:', error);
        handleError(interaction, error);
    }
}


async function configureKickProtection(interaction, guildConfig) {
    try {
        // Validação básica da configuração
        if (!guildConfig?.antiRaid?.kickProtection) {
            throw new Error('Configuração de proteção contra expulsões inválida');
        }

        const embed = new EmbedBuilder()
            .setTitle('👢 Configuração de Proteção contra Expulsões')
            .setDescription('Configure como o sistema deve reagir quando alguém tentar expulsar membros em massa.')
            .setColor('#3498DB')
            .addFields(
                {
                    name: '📊 Status Atual',
                    value: guildConfig.antiRaid.kickProtection.enabled ? 'Proteção está **ATIVADA**' : 'Proteção está **DESATIVADA**',
                    inline: false
                },
                {
                    name: '🔧 Configurações Atuais',
                    value: `Ação: **${getActionName(guildConfig.antiRaid.kickProtection.action)}**\nLimite: **${guildConfig.antiRaid.kickProtection.threshold}** expulsões em 1 minuto`,
                    inline: false
                }
            );

        // Botões de controle
        const toggleButton = new ButtonBuilder()
            .setCustomId('mod_antiraid_kick_toggle')
            .setLabel(guildConfig.antiRaid.kickProtection.enabled ? 'Desativar Proteção' : 'Ativar Proteção')
            .setStyle(guildConfig.antiRaid.kickProtection.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(guildConfig.antiRaid.kickProtection.enabled ? '<:lockalt:1365941662022504530>' : '<:lockalt:1365941662022504530>');

        const backButton = new ButtonBuilder()
            .setCustomId('mod_antiraid_panel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>');

        // Menus de seleção
        const actionSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_antiraid_kick_action')
            .setPlaceholder('Selecione a ação a ser tomada')
            .addOptions([
                { label: 'Banir Usuário', description: 'Bane o usuário do servidor', value: 'ban', emoji: '🔨' },
                { label: 'Remover Permissões', description: 'Remove todas as permissões administrativas do usuário', value: 'removePermissions', emoji: '<:lockalt:1365941662022504530>' },
                { label: 'Remover Todos os Cargos', description: 'Remove todos os cargos do usuário', value: 'removeRoles', emoji: '🏷️' }
            ]);

        const thresholdSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_antiraid_kick_threshold')
            .setPlaceholder('Selecione o limite de expulsões')
            .addOptions([
                { label: '3 expulsões', value: '3', emoji: '3️⃣' },
                { label: '5 expulsões', value: '5', emoji: '5️⃣' },
                { label: '7 expulsões', value: '7', emoji: '7️⃣' },
                { label: '10 expulsões', value: '10', emoji: '🔟' }
            ]);

        // Organização dos componentes em rows
        const rows = [
            new ActionRowBuilder().addComponents(actionSelect),
            new ActionRowBuilder().addComponents(thresholdSelect),
            new ActionRowBuilder().addComponents(toggleButton, backButton) // Botões juntos na mesma row
        ];

        // Atualizar interface
        const updateOptions = {
            embeds: [embed],
            components: rows,
            ephemeral: true
        };

        await interaction[interaction.deferred || interaction.replied ? 'update' : 'update'](updateOptions);

    } catch (error) {
        console.error('Erro ao configurar proteção contra expulsões:', error);
        await handleError(interaction, error);
    }
}


function getActionName(actionCode) {
    const actions = {
        'removePermissions': 'Remover Permissões',
        'ban': 'Banir Usuário',
        'kick': 'Expulsar Usuário',
        'removeRoles': 'Remover Todos os Cargos'
    };

    return actions[actionCode] || 'Desconhecida';
}

async function toggleChannelProtection(interaction, guildConfig) {
    try {
        // Inverter o estado atual
        guildConfig.antiRaid.channelProtection.enabled = !guildConfig.antiRaid.channelProtection.enabled;

        // Salvar configuração
        await saveConfig(interaction.guild.id, guildConfig);

        // Atualizar o painel
        await configureChannelProtection(interaction, guildConfig);

        // Enviar feedback
        await interaction.followUp({
            content: `Proteção de canais ${guildConfig.antiRaid.channelProtection.enabled ? 'ativada' : 'desativada'} com sucesso!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao alternar proteção de canais:', error);
        await interaction.followUp({
            content: 'Ocorreu um erro ao processar sua solicitação.',
            ephemeral: true
        });
    }
}


async function handleChannelActionSelect(interaction, guildConfig) {
    try {
        // Obter a ação selecionada
        const selectedAction = interaction.values[0];

        // Atualizar configuração
        guildConfig.antiRaid.channelProtection.action = selectedAction;

        // Salvar configuração
        await saveConfig(interaction.guild.id, guildConfig);

        // Atualizar o painel
        await configureChannelProtection(interaction, guildConfig);

        // Enviar feedback
        await interaction.followUp({
            content: `Ação de proteção atualizada para: ${getActionName(selectedAction)}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao processar seleção de ação:', error);
        await interaction.followUp({
            content: 'Ocorreu um erro ao processar sua solicitação.',
            ephemeral: true
        });
    }
}

async function toggleRoleProtection(interaction, guildConfig) {
    try {
        guildConfig.antiRaid.roleProtection.enabled = !guildConfig.antiRaid.roleProtection.enabled;
        await saveConfig(interaction.guild.id, guildConfig);
        await configureRoleProtection(interaction, guildConfig);

        await interaction.followUp({
            content: `Proteção de cargos ${guildConfig.antiRaid.roleProtection.enabled ? 'ativada' : 'desativada'} com sucesso!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao alternar proteção de cargos:', error);
        handleError(interaction, error);
    }
}

async function handleRoleActionSelect(interaction, guildConfig) {
    try {
        const selectedAction = interaction.values[0];
        guildConfig.antiRaid.roleProtection.action = selectedAction;
        await saveConfig(interaction.guild.id, guildConfig);
        await configureRoleProtection(interaction, guildConfig);

        await interaction.followUp({
            content: `Ação de proteção de cargos atualizada para: ${getActionName(selectedAction)}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao processar seleção de ação:', error);
        handleError(interaction, error);
    }
}

// Handlers para proteção contra banimentos
async function toggleBanProtection(interaction, guildConfig) {
    try {
        guildConfig.antiRaid.banProtection.enabled = !guildConfig.antiRaid.banProtection.enabled;
        await saveConfig(interaction.guild.id, guildConfig);
        await configureBanProtection(interaction, guildConfig);

        await interaction.followUp({
            content: `Proteção contra banimentos ${guildConfig.antiRaid.banProtection.enabled ? 'ativada' : 'desativada'} com sucesso!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao alternar proteção contra banimentos:', error);
        handleError(interaction, error);
    }
}

async function handleBanActionSelect(interaction, guildConfig) {
    try {
        const selectedAction = interaction.values[0];
        guildConfig.antiRaid.banProtection.action = selectedAction;
        await saveConfig(interaction.guild.id, guildConfig);
        await configureBanProtection(interaction, guildConfig);

        await interaction.followUp({
            content: `Ação de proteção contra banimentos atualizada para: ${getActionName(selectedAction)}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao processar seleção de ação:', error);
        handleError(interaction, error);
    }
}

async function handleBanThresholdSelect(interaction, guildConfig) {
    try {
        const threshold = parseInt(interaction.values[0]);
        guildConfig.antiRaid.banProtection.threshold = threshold;
        await saveConfig(interaction.guild.id, guildConfig);
        await configureBanProtection(interaction, guildConfig);

        await interaction.followUp({
            content: `Limite de banimentos atualizado para: ${threshold}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao processar seleção de limite:', error);
        handleError(interaction, error);
    }
}

// Handlers para proteção contra expulsões
async function toggleKickProtection(interaction, guildConfig) {
    try {
        guildConfig.antiRaid.kickProtection.enabled = !guildConfig.antiRaid.kickProtection.enabled;
        await saveConfig(interaction.guild.id, guildConfig);
        await configureKickProtection(interaction, guildConfig);

        await interaction.followUp({
            content: `Proteção contra expulsões ${guildConfig.antiRaid.kickProtection.enabled ? 'ativada' : 'desativada'} com sucesso!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao alternar proteção contra expulsões:', error);
        handleError(interaction, error);
    }
}

async function handleKickActionSelect(interaction, guildConfig) {
    try {
        const selectedAction = interaction.values[0];
        guildConfig.antiRaid.kickProtection.action = selectedAction;
        await saveConfig(interaction.guild.id, guildConfig);
        await configureKickProtection(interaction, guildConfig);

        await interaction.followUp({
            content: `Ação de proteção contra expulsões atualizada para: ${getActionName(selectedAction)}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao processar seleção de ação:', error);
        handleError(interaction, error);
    }
}

async function handleKickThresholdSelect(interaction, guildConfig) {
    try {
        const threshold = parseInt(interaction.values[0]);
        guildConfig.antiRaid.kickProtection.threshold = threshold;
        await saveConfig(interaction.guild.id, guildConfig);
        await configureKickProtection(interaction, guildConfig);

        await interaction.followUp({
            content: `Limite de expulsões atualizado para: ${threshold}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao processar seleção de limite:', error);
        handleError(interaction, error);
    }
}

// Função auxiliar para tratamento de erros
function handleError(interaction, error) {
    const errorMessage = {
        content: 'Ocorreu um erro ao processar sua solicitação.',
        ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
        interaction.followUp(errorMessage);
    } else {
        interaction.update(errorMessage);
    }
}

/**
 * Configura proteção de canais (modificada)
 */
async function configureChannelProtection(interaction, guildConfig) {
    try {
        const embed = new EmbedBuilder()
            .setTitle('📺 Configuração de Proteção de Canais')
            .setDescription('Configure como o sistema deve reagir quando alguém tentar excluir ou modificar canais em massa.')
            .setColor('#3498DB')
            .addFields(
                {
                    name: '📊 Status Atual',
                    value: guildConfig.antiRaid.channelProtection.enabled ? 'Proteção está **ATIVADA**' : 'Proteção está **DESATIVADA**',
                    inline: false
                },
                {
                    name: '🔧 Ação Atual',
                    value: `Quando detectar exclusão de canais: **${getActionName(guildConfig.antiRaid.channelProtection.action)}**`,
                    inline: false
                }
            );

        // Criar os botões corretamente
        const toggleButton = new ButtonBuilder()
            .setCustomId('mod_antiraid_channel_toggle')
            .setLabel(guildConfig.antiRaid.channelProtection.enabled ? 'Desativar Proteção' : 'Ativar Proteção')
            .setStyle(guildConfig.antiRaid.channelProtection.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(guildConfig.antiRaid.channelProtection.enabled ? '<:lockalt:1365941662022504530>' : '<:lockalt:1365941662022504530>');

        const backButton = new ButtonBuilder()
            .setCustomId('mod_antiraid_panel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>');

        const actionSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_antiraid_channel_action')
            .setPlaceholder('Selecione a ação a ser tomada')
            .addOptions([
                { label: 'Remover Permissões', description: 'Remove todas as permissões administrativas do usuário', value: 'removePermissions', emoji: '<:lockalt:1365941662022504530>' },
                { label: 'Banir Usuário', description: 'Bane o usuário do servidor', value: 'ban', emoji: '🔨' },
                { label: 'Expulsar Usuário', description: 'Expulsa o usuário do servidor', value: 'kick', emoji: '👢' },
                { label: 'Remover Todos os Cargos', description: 'Remove todos os cargos do usuário', value: 'removeRoles', emoji: '🏷️' }
            ]);

        // Organizar os componentes em rows
        const row1 = new ActionRowBuilder().addComponents(actionSelect);
        const row2 = new ActionRowBuilder().addComponents(toggleButton, backButton); // Botões na mesma row

        // Atualizar a interação
        if (interaction.deferred || interaction.replied) {
            await interaction.update({
                embeds: [embed],
                components: [row1, row2]
            });
        } else {
            await interaction.update({
                embeds: [embed],
                components: [row1, row2],
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Erro ao configurar proteção de canais:', error);

        // Melhor tratamento de erro com botão de retorno
        const errorRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('mod_antiraid_panel')
                .setLabel('Voltar')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('<:voltar:1365849508059287633>')
        );

        const errorResponse = {
            content: '❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
            components: [errorRow],
            ephemeral: true
        };

        if (interaction.deferred || interaction.replied) {
            await interaction.followUp(errorResponse);
        } else {
            await interaction.update(errorResponse);
        }
    }
}

module.exports = {
    handleInteraction,
    toggleRoleProtection,
    handleRoleActionSelect,
    toggleBanProtection,
    handleBanActionSelect,
    handleBanThresholdSelect,
    toggleKickProtection,
    handleKickActionSelect,
    handleKickThresholdSelect
};