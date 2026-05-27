const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require('discord.js');
const { saveConfig } = require('../config/saveConfig');
const { handleRoleClearConfirm } = require('../utils/roleManager');

// Função principal para lidar com interações
async function handleInteraction(interaction, client, guildConfig) {

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'mod_automod_whitelist_add_modal') {
            await handleAddDomainModal(interaction, guildConfig);
            return;
        }
    }

    const customId = interaction.customId;

    // Tratamento de painéis principais
    if (customId === 'mod_automod_panel') {
        await showAutoModPanel(interaction, guildConfig);
    } else if (customId === 'mod_automod_toggle') {
        const botRole = interaction.guild.members.me.roles.highest;
        const highestRole = interaction.guild.roles.highest;
        if (botRole.position < highestRole.position) {
            await interaction.reply({
                content: '❌ Não posso ativar o sistema Anti-Raid, pois meu cargo é menor que o cargo mais alto do servidor.',
                ephemeral: true
            });
            return;
        }
        await toggleAutoMod(interaction, guildConfig);
    }

    // Tratamento de spam
    else if (customId === 'mod_automod_spam') {
        await configureSpamDetection(interaction, guildConfig);
    } else if (customId === 'mod_automod_spam_toggle') {
        await toggleFeature(interaction, guildConfig, 'spamDetection');
    } else if (customId === 'mod_automod_spam_action') {
        await updateFeatureAction(interaction, guildConfig, 'spamDetection');
    } else if (customId === 'mod_automod_spam_threshold') {
        await updateFeatureThreshold(interaction, guildConfig, 'spamDetection', 'messageThreshold');
    } else if (customId === 'mod_automod_spam_time') {
        await updateFeatureThreshold(interaction, guildConfig, 'spamDetection', 'timeThreshold');
    }

    // Tratamento de links
    else if (customId === 'mod_automod_links') {
        await configureLinkFilter(interaction, guildConfig);
    } else if (customId === 'mod_automod_link_toggle') {
        await toggleFeature(interaction, guildConfig, 'linkFilter');
    } else if (customId === 'mod_automod_link_action') {
        await updateFeatureAction(interaction, guildConfig, 'linkFilter');
    } else if (customId === 'mod_automod_link_whitelist') {
        await showWhitelistManager(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_add') {
        await showAddDomainOptions(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_domain_select') {
        await addSelectedDomain(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_custom_domain') {
        await promptForCustomDomain(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_remove') {
        await showRemoveDomainOptions(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_remove_select') {
        await confirmDomainRemoval(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_remove_confirm') {
        await removeDomain(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_remove_cancel') {
        await showWhitelistManager(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_clear') {
        await confirmClearWhitelist(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_clear_confirm') {
        await clearWhitelist(interaction, guildConfig);
    } else if (customId === 'mod_automod_whitelist_clear_cancel') {
        await showWhitelistManager(interaction, guildConfig);
    }

    // Tratamento de menções
    else if (customId === 'mod_automod_mentions') {
        await configureMentionFilter(interaction, guildConfig);
    } else if (customId === 'mod_automod_mention_toggle') {
        await toggleFeature(interaction, guildConfig, 'mentionFilter');
    } else if (customId === 'mod_automod_mention_action') {
        await updateFeatureAction(interaction, guildConfig, 'mentionFilter');
    } else if (customId === 'mod_automod_mention_threshold') {
        await updateFeatureThreshold(interaction, guildConfig, 'mentionFilter', 'threshold');
    }

    // Gerenciamento de cargos
    else if (customId.match(/^mod_automod_(spam|link|mention)_roles$/)) {
        const type = customId.split('_')[2];
        await showRoleManagerPanel(interaction, guildConfig, type);
    } else if (customId.match(/^mod_automod_(spam|link|mention)_role_add$/)) {
        const type = customId.split('_')[2];
        await handleRoleAdd(interaction, guildConfig, type);
    } else if (customId.match(/^mod_automod_(spam|link|mention)_role_remove$/)) {
        const type = customId.split('_')[2];
        await handleRoleRemove(interaction, guildConfig, type);
    } else if (customId.match(/^mod_automod_(spam|link|mention)_role_clear$/)) {
        const type = customId.split('_')[2];
        await handleRoleClear(interaction, guildConfig, type);
    } else if (customId.match(/^mod_automod_(spam|link|mention)_role_clear_confirm$/)) {
        const type = customId.split('_')[2];
        await handleRoleClearConfirm(interaction, guildConfig, type);
    } else if (customId.match(/^mod_automod_(spam|link|mention)_role_clear_cancel$/)) {
        const type = customId.split('_')[2];
        await showRoleManagerPanel(interaction, guildConfig, type);
    }
}

// Funções unificadas para atualizar configurações
async function toggleFeature(interaction, guildConfig, featurePath) {
    guildConfig.autoMod[featurePath].enabled = !guildConfig.autoMod[featurePath].enabled;
    await saveConfig(interaction.guild.id, guildConfig);

    // Redirecionar para o painel apropriado
    if (featurePath === 'spamDetection') {
        await configureSpamDetection(interaction, guildConfig);
    } else if (featurePath === 'linkFilter') {
        await configureLinkFilter(interaction, guildConfig);
    } else if (featurePath === 'mentionFilter') {
        await configureMentionFilter(interaction, guildConfig);
    }
}

async function updateFeatureAction(interaction, guildConfig, featurePath) {
    const selectedAction = interaction.values[0];
    guildConfig.autoMod[featurePath].action = selectedAction;
    await saveConfig(interaction.guild.id, guildConfig);

    // Redirecionar para o painel apropriado
    if (featurePath === 'spamDetection') {
        await configureSpamDetection(interaction, guildConfig);
    } else if (featurePath === 'linkFilter') {
        await configureLinkFilter(interaction, guildConfig);
    } else if (featurePath === 'mentionFilter') {
        await configureMentionFilter(interaction, guildConfig);
    }
}

async function updateFeatureThreshold(interaction, guildConfig, featurePath, thresholdType) {
    const selectedValue = parseInt(interaction.values[0]);
    guildConfig.autoMod[featurePath][thresholdType] = selectedValue;
    await saveConfig(interaction.guild.id, guildConfig);

    // Redirecionar para o painel apropriado
    if (featurePath === 'spamDetection') {
        await configureSpamDetection(interaction, guildConfig);
    } else if (featurePath === 'linkFilter') {
        await configureLinkFilter(interaction, guildConfig);
    } else if (featurePath === 'mentionFilter') {
        await configureMentionFilter(interaction, guildConfig);
    }
}

// Função de validação de configurações
function validateModConfig(guildConfig) {
    // Estrutura base do autoMod
    if (!guildConfig.autoMod) {
        guildConfig.autoMod = {
            enabled: false
        };
    }

    // Validação do spamDetection
    if (!guildConfig.autoMod.spamDetection) {
        guildConfig.autoMod.spamDetection = {
            enabled: false,
            messageThreshold: 5,
            timeThreshold: 5,
            action: 'timeout',
            duration: 10,
            whitelistedRoles: []
        };
    }

    // Garantir que todos os campos necessários existem
    const spamConfig = guildConfig.autoMod.spamDetection;
    spamConfig.enabled = spamConfig.enabled ?? false;
    spamConfig.messageThreshold = spamConfig.messageThreshold ?? 5;
    spamConfig.timeThreshold = spamConfig.timeThreshold ?? 5;
    spamConfig.action = spamConfig.action ?? 'timeout';
    spamConfig.duration = spamConfig.duration ?? 10;
    spamConfig.whitelistedRoles = spamConfig.whitelistedRoles ?? [];

    // Validação do linkFilter
    if (!guildConfig.autoMod.linkFilter) {
        guildConfig.autoMod.linkFilter = {
            enabled: false,
            whitelistedDomains: [],
            whitelistedRoles: [],
            action: 'delete'
        };
    }

    // Validação do mentionFilter
    if (!guildConfig.autoMod.mentionFilter) {
        guildConfig.autoMod.mentionFilter = {
            enabled: false,
            threshold: 5,
            action: 'timeout',
            duration: 10,
            whitelistedRoles: []
        };
    }

    return guildConfig;
}

// Painel principal de automoderação
async function showAutoModPanel(interaction, guildConfig) {
    // Inicializar configuração se não existir
    guildConfig = validateModConfig(guildConfig);
    await saveConfig(interaction.guild.id, guildConfig);

    const embed = new EmbedBuilder()
        .setTitle('🤖 Configuração do Auto-Moderador')
        .setDescription('Configure como o bot deve reagir automaticamente a comportamentos inadequados.')
        .setColor('#3498DB')
        .addFields(
            {
                name: '📊 Status Atual',
                value: guildConfig.autoMod.enabled ? 'Auto-Moderador está **ATIVADO**' : 'Auto-Moderador está **DESATIVADO**',
                inline: false
            },
            {
                name: '🔄 Detecção de Spam',
                value: `Status: ${guildConfig.autoMod.spamDetection.enabled ? '✅ Ativado' : '❌ Desativado'}\nLimite: ${guildConfig.autoMod.spamDetection.messageThreshold} mensagens em ${guildConfig.autoMod.spamDetection.timeThreshold} segundos\nAção: ${getActionName(guildConfig.autoMod.spamDetection.action)}`,
                inline: true
            },
            {
                name: '🔗 Filtro de Links',
                value: `Status: ${guildConfig.autoMod.linkFilter.enabled ? '✅ Ativado' : '❌ Desativado'}\nDomínios permitidos: ${guildConfig.autoMod.linkFilter.whitelistedDomains.length || 'Nenhum'}\nAção: ${getActionName(guildConfig.autoMod.linkFilter.action)}`,
                inline: true
            },
            {
                name: '📢 Filtro de Menções',
                value: `Status: ${guildConfig.autoMod.mentionFilter.enabled ? '✅ Ativado' : '❌ Desativado'}\nLimite: ${guildConfig.autoMod.mentionFilter.threshold} menções\nAção: ${getActionName(guildConfig.autoMod.mentionFilter.action)}`,
                inline: true
            }
        );

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('configModeracao')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>'),
        new ButtonBuilder()
            .setCustomId('mod_automod_toggle')
            .setLabel(guildConfig.autoMod.enabled ? 'Desativar Auto-Moderador' : 'Ativar Auto-Moderador')
            .setStyle(guildConfig.autoMod.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(guildConfig.autoMod.enabled ? '⏸️' : '▶️')
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mod_automod_spam')
            .setLabel('Detecção de Spam')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:roundedx:1365942436697735268>'),
        new ButtonBuilder()
            .setCustomId('mod_automod_links')
            .setLabel('Filtro de Links')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:link:1365943213042569248>'),
        new ButtonBuilder()
            .setCustomId('mod_automod_mentions')
            .setLabel('Filtro de Menções')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('<:at:1365940208389980251>')
    );

    await interaction.update({
        embeds: [embed],
        components: [row2, row1],
        ephemeral: true
    });
}

// Ativar/desativar automoderação
async function toggleAutoMod(interaction, guildConfig) {
    guildConfig.autoMod.enabled = !guildConfig.autoMod.enabled;
    await saveConfig(interaction.guild.id, guildConfig);
    await showAutoModPanel(interaction, guildConfig);
}

// Configuração de detecção de spam
async function configureSpamDetection(interaction, guildConfig) {
    try {
        // Validar e garantir a estrutura da configuração
        guildConfig = validateModConfig(guildConfig);
        const config = guildConfig.autoMod.spamDetection;

        const embed = new EmbedBuilder()
            .setTitle('🔄 Configuração de Detecção de Spam')
            .setDescription('Configure como o bot deve reagir a mensagens repetitivas enviadas rapidamente.')
            .setColor('#3498DB')
            .addFields(
                {
                    name: '📊 Status Atual',
                    value: config.enabled ? 'Detecção de spam está **ATIVADA**' : 'Detecção de spam está **DESATIVADA**',
                    inline: false
                },
                {
                    name: '⚙️ Configuração Atual',
                    value: `Limite: **${config.messageThreshold} mensagens** em **${config.timeThreshold} segundos**\nAção: **${getActionName(config.action)}**\nDuração (se timeout): **${config.duration} minutos**`,
                    inline: false
                },
                {
                    name: '🛡️ Cargos Isentos',
                    value: config.whitelistedRoles?.length > 0
                        ? config.whitelistedRoles.map(roleId => {
                            const role = interaction.guild.roles.cache.get(roleId);
                            return role ? `<@&${roleId}>` : 'Cargo não encontrado';
                        }).join(', ')
                        : 'Nenhum cargo isento',
                    inline: false
                }
            );

        const toggleButton = new ButtonBuilder()
            .setCustomId('mod_automod_spam_toggle')
            .setLabel(config.enabled ? 'Desativar Detecção' : 'Ativar Detecção')
            .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(config.enabled ? '⏸️' : '▶️');

        const roleButton = new ButtonBuilder()
            .setCustomId('mod_automod_spam_roles')
            .setLabel('Gerenciar Cargos Isentos')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛡️');

        const actionSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_automod_spam_action')
            .setPlaceholder('Selecione a ação a ser tomada')
            .addOptions([
                { label: 'Timeout (Castigo)', description: 'Silencia temporariamente o usuário', value: 'timeout', emoji: '⏱️' },
                { label: 'Deletar Mensagens', description: 'Apenas deleta as mensagens de spam', value: 'delete', emoji: '🗑️' },
                { label: 'Avisar Usuário', description: 'Envia um aviso ao usuário', value: 'warn', emoji: '⚠️' },
                { label: 'Banir Usuário', description: 'Bane o usuário do servidor', value: 'ban', emoji: '🔨' },
                { label: 'Expulsar Usuário', description: 'Expulsa o usuário do servidor', value: 'kick', emoji: '👢' }
            ]);

        const thresholdSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_automod_spam_threshold')
            .setPlaceholder('Selecione o limite de mensagens')
            .addOptions([
                { label: '3 mensagens', value: '3', emoji: '3️⃣' },
                { label: '5 mensagens', value: '5', emoji: '5️⃣' },
                { label: '7 mensagens', value: '7', emoji: '7️⃣' },
                { label: '10 mensagens', value: '10', emoji: '🔟' }
            ]);

        const timeSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_automod_spam_time')
            .setPlaceholder('Selecione o intervalo de tempo (segundos)')
            .addOptions([
                { label: '3 segundos', value: '3', emoji: '⏱️' },
                { label: '5 segundos', value: '5', emoji: '⏱️' },
                { label: '10 segundos', value: '10', emoji: '⏱️' },
                { label: '15 segundos', value: '15', emoji: '⏱️' }
            ]);

        const row1 = new ActionRowBuilder().addComponents(toggleButton, roleButton);
        const row2 = new ActionRowBuilder().addComponents(actionSelect);
        const row3 = new ActionRowBuilder().addComponents(thresholdSelect);
        const row4 = new ActionRowBuilder().addComponents(timeSelect);
        const row5 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('mod_automod_panel')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('<:voltar:1365849508059287633>')
        );

        await interaction.update({
            embeds: [embed],
            components: [row1, row2, row3, row4, row5],
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro ao configurar detecção de spam:', error);
        await handleError(interaction);
    }
}

// Configuração de filtro de links
async function configureLinkFilter(interaction, guildConfig) {
    try {
        // Validar configuração
        guildConfig = validateModConfig(guildConfig);
        const config = guildConfig.autoMod.linkFilter;

        const embed = new EmbedBuilder()
            .setTitle('🔗 Configuração do Filtro de Links')
            .setDescription('Configure como o bot deve lidar com links enviados no servidor.')
            .setColor('#3498DB')
            .addFields(
                {
                    name: '📊 Status Atual',
                    value: config.enabled ? 'Filtro de links está **ATIVADO**' : 'Filtro de links está **DESATIVADO**',
                    inline: false
                },
                {
                    name: '⚙️ Configuração Atual',
                    value: `Ação: **${getActionName(config.action)}**\nDomínios permitidos: ${config.whitelistedDomains?.length > 0 ? config.whitelistedDomains.join(', ') : 'Nenhum'}`,
                    inline: false
                },
                {
                    name: '🛡️ Cargos Isentos',
                    value: config.whitelistedRoles?.length > 0
                        ? config.whitelistedRoles.map(roleId =>
                            `<@&${roleId}>`
                        ).join(', ')
                        : 'Nenhum cargo isento',
                    inline: false
                }
            );

        const toggleButton = new ButtonBuilder()
            .setCustomId('mod_automod_link_toggle')
            .setLabel(config.enabled ? 'Desativar Filtro' : 'Ativar Filtro')
            .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(config.enabled ? '⏸️' : '▶️');

        const backButton = new ButtonBuilder()
            .setCustomId('mod_automod_panel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>');

        const roleButton = new ButtonBuilder()
            .setCustomId('mod_automod_link_roles')
            .setLabel('Gerenciar Cargos Isentos')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛡️');

        const whitelistButton = new ButtonBuilder()
            .setCustomId('mod_automod_link_whitelist')
            .setLabel('Gerenciar Domínios Permitidos')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔗');

        const actionSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_automod_link_action')
            .setPlaceholder('Selecione a ação a ser tomada')
            .addOptions([
                { label: 'Deletar Mensagem', description: 'Apenas deleta a mensagem com o link', value: 'delete', emoji: '🗑️' },
                { label: 'Timeout', description: 'Silencia temporariamente o usuário', value: 'timeout', emoji: '⏱️' },
                { label: 'Avisar', description: 'Envia um aviso ao usuário', value: 'warn', emoji: '⚠️' },
                { label: 'Banir', description: 'Bane o usuário do servidor', value: 'ban', emoji: '🔨' }
            ]);

        const row1 = new ActionRowBuilder().addComponents(actionSelect);
        const row2 = new ActionRowBuilder().addComponents(toggleButton, roleButton, whitelistButton);
        const row3 = new ActionRowBuilder().addComponents(backButton);

        await interaction.update({
            embeds: [embed],
            components: [row1, row2, row3],
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro ao configurar filtro de links:', error);
        await handleError(interaction);
    }
}

// Gerenciamento de whitelist de domínios
async function showWhitelistManager(interaction, guildConfig, updateOnly = false) {
    try {
        // Garantir que a configuração existe
        guildConfig = validateModConfig(guildConfig);
        const domains = guildConfig.autoMod.linkFilter.whitelistedDomains;

        const embed = new EmbedBuilder()
            .setTitle('📝 Gerenciador de Whitelist de Domínios')
            .setDescription('Gerencie os domínios permitidos no servidor. Domínios na whitelist não serão filtrados pelo sistema.')
            .setColor('#3498DB')
            .addFields(
                {
                    name: '📋 Domínios Permitidos',
                    value: domains.length > 0 ?
                        domains.map((domain, index) => `${index + 1}. ${domain}`).join('\n') :
                        'Nenhum domínio permitido',
                    inline: false
                },
                {
                    name: '❓ Como usar',
                    value: 'Use os botões abaixo para adicionar ou remover domínios da whitelist.\nExemplo de formato: discord.com, youtube.com',
                    inline: false
                }
            )
            .setFooter({ text: 'Máximo de 10 domínios permitidos' });

        // Criar botões
        const addButton = new ButtonBuilder()
            .setCustomId('mod_automod_whitelist_add')
            .setLabel('Adicionar Domínio')
            .setStyle(ButtonStyle.Success)
            .setEmoji('➕')
            .setDisabled(domains.length >= 10);

        const removeButton = new ButtonBuilder()
            .setCustomId('mod_automod_whitelist_remove')
            .setLabel('Remover Domínio')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('➖')
            .setDisabled(domains.length === 0);

        const clearButton = new ButtonBuilder()
            .setCustomId('mod_automod_whitelist_clear')
            .setLabel('Limpar Lista')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🗑️')
            .setDisabled(domains.length === 0);

        const backButton = new ButtonBuilder()
            .setCustomId('mod_automod_links')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>');

        const row1 = new ActionRowBuilder().addComponents(addButton, removeButton);
        const row2 = new ActionRowBuilder().addComponents(clearButton, backButton);

        if (updateOnly) {
            await interaction.editReply({
                embeds: [embed],
                components: [row1, row2],
                content: '',
                ephemeral: true
            });
        } else {
            await interaction.update({
                embeds: [embed],
                components: [row1, row2],
                content: '',
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Erro ao mostrar gerenciador de whitelist:', error);
        await handleError(interaction);
    }
}

// Opções para adicionar domínio
async function showAddDomainOptions(interaction, guildConfig) {
    try {
        // Validar configuração
        guildConfig = validateModConfig(guildConfig);
        const domains = guildConfig.autoMod.linkFilter.whitelistedDomains;

        // Verificar limite de domínios
        if (domains.length >= 10) {
            await interaction.update({
                content: '❌ **Limite atingido!** Você já possui 10 domínios na whitelist. Remova algum antes de adicionar mais.',
                components: [createBackButtonRow()],
                ephemeral: true
            });
            return;
        }

        // Criar opções para domínios comuns
        const commonDomains = [
            { label: 'Discord', value: 'discord.com', description: 'Plataforma de comunicação' },
            { label: 'YouTube', value: 'youtube.com', description: 'Plataforma de vídeos' },
            { label: 'Twitch', value: 'twitch.tv', description: 'Plataforma de streaming' },
            { label: 'Twitter/X', value: 'twitter.com', description: 'Rede social' },
            { label: 'Facebook', value: 'facebook.com', description: 'Rede social' },
            { label: 'Instagram', value: 'instagram.com', description: 'Rede social de fotos' },
            { label: 'Reddit', value: 'reddit.com', description: 'Fórum de discussão' },
            { label: 'GitHub', value: 'github.com', description: 'Plataforma de desenvolvimento' }
        ];

        // Filtrar domínios já existentes na whitelist
        const availableDomains = commonDomains.filter(domain =>
            !domains.includes(domain.value)
        );

        // Criar componentes de interface
        const components = [];

        // Adicionar select menu se houver domínios disponíveis
        if (availableDomains.length > 0) {
            const domainSelect = new StringSelectMenuBuilder()
                .setCustomId('mod_automod_whitelist_domain_select')
                .setPlaceholder('Selecione um domínio comum')
                .addOptions(availableDomains);

            components.push(new ActionRowBuilder().addComponents(domainSelect));
        }

        // Botão para domínio personalizado
        const customDomainButton = new ButtonBuilder()
            .setCustomId('mod_automod_whitelist_custom_domain')
            .setLabel('Adicionar Domínio Personalizado')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✏️');

        // Botão para voltar
        const backButton = new ButtonBuilder()
            .setCustomId('mod_automod_link_whitelist')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>');

        components.push(new ActionRowBuilder().addComponents(customDomainButton, backButton));

        // Atualizar interação
        await interaction.update({
            content: '**Adicionar Domínio à Whitelist**\nSelecione um domínio comum ou use o botão para adicionar um domínio personalizado.',
            components: components,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao mostrar opções de adição de domínio:', error);
        await handleError(interaction);
    }
}

// Adicionar domínio selecionado
async function addSelectedDomain(interaction, guildConfig) {
    try {
        const domain = interaction.values[0];

        // Verificar duplicata
        if (guildConfig.autoMod.linkFilter.whitelistedDomains.includes(domain)) {
            await interaction.update({
                content: '❌ **Domínio duplicado!** Este domínio já está na whitelist.',
                components: [createBackButtonRow()],
                ephemeral: true
            });
            return;
        }

        // Adicionar domínio
        guildConfig.autoMod.linkFilter.whitelistedDomains.push(domain);
        await saveConfig(interaction.guild.id, guildConfig);

        // Mostrar confirmação
        await interaction.update({
            content: `✅ **Sucesso!** Domínio \`${domain}\` adicionado à whitelist.`,
            components: [createBackButtonRow()],
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao adicionar domínio selecionado:', error);
        await handleError(interaction);
    }
}

// Solicitar domínio personalizado
async function promptForCustomDomain(interaction, guildConfig) {
    try {
        // Criar um modal para entrada do domínio
        const modal = new ModalBuilder()
            .setCustomId('mod_automod_whitelist_add_modal')
            .setTitle('Adicionar Domínio Personalizado');

        // Criar campo de texto para o domínio
        const domainInput = new TextInputBuilder()
            .setCustomId('domain_input')
            .setLabel('Digite o domínio (ex: exemplo.com)')
            .setPlaceholder('Sem http:// ou www.')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(4)
            .setMaxLength(100);

        // Adicionar o campo ao modal
        const firstActionRow = new ActionRowBuilder().addComponents(domainInput);
        modal.addComponents(firstActionRow);

        // Mostrar o modal
        await interaction.showModal(modal);
    } catch (error) {
        console.error('Erro ao mostrar modal de domínio:', error);
        await handleError(interaction);
    }
}

async function handleAddDomainModal(interaction, guildConfig) {
    try {
        const domain = interaction.fields.getTextInputValue('domain_input')
            .toLowerCase()
            .replace(/^https?:\/\//i, '')
            .replace(/\/.*$/, '')
            .replace(/^www\./, '')
            .trim();

        // Validar o domínio
        if (!isValidDomain(domain)) {
            await interaction.reply({
                content: '❌ **Formato inválido!** Por favor, use um formato de domínio válido (ex: discord.com).',
                ephemeral: true
            });
            return;
        }

        // Verificar duplicata
        if (guildConfig.autoMod.linkFilter.whitelistedDomains.includes(domain)) {
            await interaction.reply({
                content: '❌ **Domínio duplicado!** Este domínio já está na whitelist.',
                ephemeral: true
            });
            return;
        }

        // Verificar limite de domínios
        if (guildConfig.autoMod.linkFilter.whitelistedDomains.length >= 10) {
            await interaction.reply({
                content: '❌ **Limite atingido!** Você já possui 10 domínios na whitelist. Remova algum antes de adicionar mais.',
                ephemeral: true
            });
            return;
        }

        // Adicionar à whitelist
        guildConfig.autoMod.linkFilter.whitelistedDomains.push(domain);
        await saveConfig(interaction.guild.id, guildConfig);

        // Confirmar adição e mostrar o painel atualizado
        await interaction.reply({
            content: `✅ **Sucesso!** Domínio \`${domain}\` adicionado à whitelist.`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro ao processar domínio do modal:', error);
        await interaction.reply({
            content: '❌ Ocorreu um erro ao adicionar o domínio. Por favor, tente novamente.',
            ephemeral: true
        });
    }
}

// Opções para remover domínio
async function showRemoveDomainOptions(interaction, guildConfig) {
    try {
        const domains = guildConfig.autoMod.linkFilter.whitelistedDomains;

        // Verificar se há domínios para remover
        if (domains.length === 0) {
            await interaction.update({
                content: "ℹ️ **Lista vazia!** Não há domínios na whitelist para remover.",
                components: [createBackButtonRow()],
                ephemeral: true
            });
            return;
        }

        // Criar menu de seleção
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('mod_automod_whitelist_remove_select')
            .setPlaceholder('Selecione o domínio para remover')
            .addOptions(
                domains.map((domain) => ({
                    label: truncateString(domain, 25),
                    value: domain,
                    description: `Remover: ${truncateString(domain, 50)}`,
                    emoji: '🗑️'
                }))
            );

        const backButton = new ButtonBuilder()
            .setCustomId('mod_automod_link_whitelist')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>');

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(backButton);

        await interaction.update({
            content: '**Selecione o domínio que deseja remover:**',
            components: [row1, row2],
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao mostrar opções de remoção de domínio:', error);
        await handleError(interaction);
    }
}

// Confirmar remoção de domínio
async function confirmDomainRemoval(interaction, guildConfig) {
    try {
        const domainToRemove = interaction.values[0];

        // Verificar se o domínio ainda existe na lista
        if (!guildConfig.autoMod.linkFilter.whitelistedDomains.includes(domainToRemove)) {
            await interaction.update({
                content: "⚠️ **Domínio não encontrado!** O domínio selecionado não está mais na whitelist.",
                components: [createBackButtonRow()],
                ephemeral: true
            });
            return;
        }

        // Criar botões de confirmação
        const confirmButton = new ButtonBuilder()
            .setCustomId('mod_automod_whitelist_remove_confirm')
            .setLabel('Confirmar Remoção')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('✅');

        const cancelButton = new ButtonBuilder()
            .setCustomId('mod_automod_whitelist_remove_cancel')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const confirmRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        // Guardar o domínio a ser removido temporariamente
        interaction.client.tempData = interaction.client.tempData || {};
        interaction.client.tempData[`${interaction.guild.id}_${interaction.user.id}_domainToRemove`] = domainToRemove;

        await interaction.update({
            content: `⚠️ **Confirmação necessária!** Você está prestes a remover o domínio \`${domainToRemove}\` da whitelist. Esta ação não pode ser desfeita.`,
            embeds: [],
            components: [confirmRow],
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao confirmar remoção de domínio:', error);
        await handleError(interaction);
    }
}

// Remover domínio
async function removeDomain(interaction, guildConfig) {
    try {
        // Recuperar o domínio a ser removido
        const tempKey = `${interaction.guild.id}_${interaction.user.id}_domainToRemove`;
        const domainToRemove = interaction.client.tempData?.[tempKey];

        if (!domainToRemove) {
            await interaction.update({
                content: "❌ **Erro!** Não foi possível identificar o domínio a ser removido.",
                components: [createBackButtonRow()],
                ephemeral: true
            });
            return;
        }

        // Remover o domínio
        guildConfig.autoMod.linkFilter.whitelistedDomains =
            guildConfig.autoMod.linkFilter.whitelistedDomains.filter(d => d !== domainToRemove);

        // Salvar configuração
        await saveConfig(interaction.guild.id, guildConfig);

        // Limpar dados temporários
        delete interaction.client.tempData[tempKey];

        await interaction.update({
            content: `✅ **Sucesso!** Domínio \`${domainToRemove}\` removido da whitelist.`,
            embeds: [],
            components: [createBackButtonRow()],
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao remover domínio:', error);
        await handleError(interaction);
    }
}

// Confirmar limpeza da whitelist
async function confirmClearWhitelist(interaction, guildConfig) {
    const confirmButton = new ButtonBuilder()
        .setCustomId('mod_automod_whitelist_clear_confirm')
        .setLabel('Confirmar Limpeza')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⚠️');

    const cancelButton = new ButtonBuilder()
        .setCustomId('mod_automod_whitelist_clear_cancel')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✖️');

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    await interaction.update({
        content: '⚠️ Tem certeza que deseja limpar toda a whitelist? Esta ação não pode ser desfeita!',
        embeds: [],
        components: [row],
        ephemeral: true
    });
}

// Limpar whitelist
async function clearWhitelist(interaction, guildConfig) {
    try {
        guildConfig.autoMod.linkFilter.whitelistedDomains = [];
        await saveConfig(interaction.guild.id, guildConfig);

        await interaction.update({
            content: '✅ Whitelist limpa com sucesso!',
            components: [createBackButtonRow()],
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao limpar whitelist:', error);
        await handleError(interaction);
    }
}

// Configuração de filtro de menções
async function configureMentionFilter(interaction, guildConfig) {
    try {
        // Validar e inicializar configuração
        guildConfig = validateModConfig(guildConfig);
        const config = guildConfig.autoMod.mentionFilter;

        const embed = new EmbedBuilder()
            .setTitle('📢 Configuração do Filtro de Menções')
            .setDescription('Configure como o bot deve lidar com spam de menções.')
            .setColor('#3498DB')
            .addFields(
                {
                    name: '📊 Status Atual',
                    value: config.enabled ? 'Filtro de menções está **ATIVADO**' : 'Filtro de menções está **DESATIVADO**',
                    inline: false
                },
                {
                    name: '⚙️ Configuração Atual',
                    value: `Limite: **${config.threshold}** menções\nAção: **${getActionName(config.action)}**`,
                    inline: false
                },
                {
                    name: '🛡️ Cargos Isentos',
                    value: config.whitelistedRoles?.length > 0
                        ? config.whitelistedRoles.map(roleId =>
                            `<@&${roleId}>`
                        ).join(', ')
                        : 'Nenhum cargo isento',
                    inline: false
                }
            );

        const toggleButton = new ButtonBuilder()
            .setCustomId('mod_automod_mention_toggle')
            .setLabel(config.enabled ? 'Desativar Filtro' : 'Ativar Filtro')
            .setStyle(config.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(config.enabled ? '⏸️' : '▶️');

        const backButton = new ButtonBuilder()
            .setCustomId('mod_automod_panel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('<:voltar:1365849508059287633>');

        const actionSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_automod_mention_action')
            .setPlaceholder('Selecione a ação a ser tomada')
            .addOptions([
                { label: 'Timeout', description: 'Silencia temporariamente o usuário', value: 'timeout', emoji: '⏱️' },
                { label: 'Avisar', description: 'Envia um aviso ao usuário', value: 'warn', emoji: '⚠️' },
                { label: 'Banir', description: 'Bane o usuário do servidor', value: 'ban', emoji: '🔨' }
            ]);

        const thresholdSelect = new StringSelectMenuBuilder()
            .setCustomId('mod_automod_mention_threshold')
            .setPlaceholder('Selecione o limite de menções')
            .addOptions([
                { label: '3 menções', value: '3', emoji: '3️⃣' },
                { label: '5 menções', value: '5', emoji: '5️⃣' },
                { label: '7 menções', value: '7', emoji: '7️⃣' },
                { label: '10 menções', value: '10', emoji: '🔟' }
            ]);

        const roleButton = new ButtonBuilder()
            .setCustomId('mod_automod_mention_roles')
            .setLabel('Gerenciar Cargos Isentos')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛡️');

        const row1 = new ActionRowBuilder().addComponents(actionSelect);
        const row2 = new ActionRowBuilder().addComponents(thresholdSelect);
        const row3 = new ActionRowBuilder().addComponents(backButton, toggleButton, roleButton);

        await interaction.update({
            embeds: [embed],
            components: [row1, row2, row3],
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro ao configurar filtro de menções:', error);
        await handleError(interaction);
    }
}

// Gerenciamento de cargos
async function showRoleManagerPanel(interaction, guildConfig, type) {
    try {
        // Mapear configurações para cada tipo de moderação
        const configMap = {
            spam: {
                title: '🔄 Cargos Isentos - Detecção de Spam',
                configPath: 'spamDetection',
                returnCommand: 'mod_automod_spam'
            },
            link: {
                title: '🔗 Cargos Isentos - Filtro de Links',
                configPath: 'linkFilter',
                returnCommand: 'mod_automod_links'
            },
            mention: {
                title: '📢 Cargos Isentos - Filtro de Menções',
                configPath: 'mentionFilter',
                returnCommand: 'mod_automod_mentions'
            }
        };

        const config = configMap[type];
        if (!config) {
            throw new Error(`Tipo de moderação inválido: ${type}`);
        }

        // Garantir que a configuração existe
        guildConfig = validateModConfig(guildConfig);
        const currentConfig = guildConfig.autoMod[config.configPath];

        // Criar embed
        const embed = new EmbedBuilder()
            .setTitle(config.title)
            .setDescription('Configure quais cargos não serão afetados por esta moderação.')
            .setColor('#3498DB')
            .addFields(
                {
                    name: '📋 Cargos Isentos Atuais',
                    value: currentConfig.whitelistedRoles.length > 0 ?
                        currentConfig.whitelistedRoles.map(roleId => {
                            const role = interaction.guild.roles.cache.get(roleId);
                            return role ? `<@&${roleId}>` : 'Cargo não encontrado';
                        }).join('\n') :
                        'Nenhum cargo isento',
                    inline: false
                }
            );

        // Componentes da interface
        const components = [];

        // Select menu para adicionar cargos
        const availableRoles = interaction.guild.roles.cache
            .filter(role =>
                role.id !== interaction.guild.id && // Excluir @everyone
                !currentConfig.whitelistedRoles.includes(role.id) // Excluir cargos já isentos
            )
            .sort((a, b) => b.position - a.position);

        if (availableRoles.size > 0) {
            // Limitar a 25 cargos para o menu de seleção
            const rolesToShow = Array.from(availableRoles.values()).slice(0, 25);

            const addRoleSelect = new StringSelectMenuBuilder()
                .setCustomId(`mod_automod_${type}_role_add`)
                .setPlaceholder('Selecione cargos para adicionar')
                .setMinValues(1)
                .setMaxValues(Math.min(rolesToShow.length, 10));

            // Adicionar opções limitadas a 25
            addRoleSelect.addOptions(
                rolesToShow.map(role => ({
                    label: role.name,
                    value: role.id,
                    description: `Adicionar ${role.name} aos cargos isentos`,
                    emoji: '➕'
                }))
            );

            components.push(new ActionRowBuilder().addComponents(addRoleSelect));
        }

        // Select menu para remover cargos
        // Select menu para remover cargos
        if (currentConfig.whitelistedRoles.length > 0) {
            // Limitar a 25 cargos para o menu de remoção
            const rolesToRemove = currentConfig.whitelistedRoles.slice(0, 25);

            const removeRoleSelect = new StringSelectMenuBuilder()
                .setCustomId(`mod_automod_${type}_role_remove`)
                .setPlaceholder('Selecione cargos para remover')
                .setMinValues(1)
                .setMaxValues(Math.min(rolesToRemove.length, 25));

            // Adicionar opções limitadas a 25
            removeRoleSelect.addOptions(
                rolesToRemove.map(roleId => {
                    const role = interaction.guild.roles.cache.get(roleId);
                    return {
                        label: role ? role.name : 'Cargo Desconhecido',
                        value: roleId,
                        description: `Remover ${role ? role.name : 'cargo'} dos isentos`,
                        emoji: '➖'
                    };
                })
            );

            components.push(new ActionRowBuilder().addComponents(removeRoleSelect));
        }

        // Botões de ação
        const actionButtons = [];

        if (currentConfig.whitelistedRoles.length > 0) {
            actionButtons.push(
                new ButtonBuilder()
                    .setCustomId(`mod_automod_${type}_role_clear`)
                    .setLabel('Limpar Todos')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🗑️')
            );
        }

        actionButtons.push(
            new ButtonBuilder()
                .setCustomId(config.returnCommand)
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('<:voltar:1365849508059287633>')
        );

        components.push(new ActionRowBuilder().addComponents(actionButtons));

        // Atualizar a mensagem
        await interaction.update({
            embeds: [embed],
            components: components,
            ephemeral: true
        });

    } catch (error) {
        console.error('Erro ao mostrar painel de gerenciamento de cargos:', error);
        await handleError(interaction);
    }
}

// Adicionar cargos isentos
async function handleRoleAdd(interaction, guildConfig, type) {
    try {
        const configPath = type === 'spam' ? 'spamDetection' :
            type === 'link' ? 'linkFilter' : 'mentionFilter';

        const selectedRoles = interaction.values;
        let currentConfig = guildConfig.autoMod[configPath];

        // Garantir que whitelistedRoles seja um array antes de manipulá-lo
        if (!Array.isArray(currentConfig.whitelistedRoles)) {
            currentConfig.whitelistedRoles = [];
        }

        currentConfig.whitelistedRoles = [
            ...new Set([...currentConfig.whitelistedRoles, ...selectedRoles])
        ];

        await saveConfig(interaction.guild.id, guildConfig);
        await showRoleManagerPanel(interaction, guildConfig, type);
    } catch (error) {
        console.error('Erro ao adicionar cargos:', error);
        await handleError(interaction);
    }
}

// Remover cargos isentos
async function handleRoleRemove(interaction, guildConfig, type) {
    try {
        const configPath = type === 'spam' ? 'spamDetection' :
            type === 'link' ? 'linkFilter' : 'mentionFilter';

        const selectedRoles = interaction.values;
        const currentConfig = guildConfig.autoMod[configPath];

        currentConfig.whitelistedRoles = currentConfig.whitelistedRoles.filter(
            roleId => !selectedRoles.includes(roleId)
        );

        await saveConfig(interaction.guild.id, guildConfig);
        await showRoleManagerPanel(interaction, guildConfig, type);
    } catch (error) {
        console.error('Erro ao remover cargos:', error);
        await handleError(interaction);
    }
}

// Limpar cargos isentos
async function handleRoleClear(interaction, guildConfig, type) {
    try {
        // Criar botões de confirmação
        const confirmButton = new ButtonBuilder()
            .setCustomId(`mod_automod_${type}_role_clear_confirm`)
            .setLabel('Confirmar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⚠️');

        const cancelButton = new ButtonBuilder()
            .setCustomId(`mod_automod_${type}_role_clear_cancel`)
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        await interaction.update({
            content: '⚠️ **Tem certeza?** Esta ação removerá todos os cargos isentos e não pode ser desfeita.',
            embeds: [],
            components: [row],
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao processar limpeza de cargos:', error);
        await handleError(interaction);
    }
}

// Funções auxiliares
function createBackButtonRow() {
    const backButton = new ButtonBuilder()
        .setCustomId('mod_automod_link_whitelist')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:voltar:1365849508059287633>');

    return new ActionRowBuilder().addComponents(backButton);
}

function truncateString(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

function isValidDomain(domain) {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
}

function getActionName(actionCode) {
    const actions = {
        'timeout': 'Timeout (Castigo)',
        'delete': 'Deletar Mensagens',
        'warn': 'Avisar Usuário',
        'ban': 'Banir Usuário',
        'kick': 'Expulsar Usuário'
    };

    return actions[actionCode] || 'Desconhecida';
}

async function handleError(interaction) {
    await interaction.update({
        content: '❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_automod_panel')
                    .setLabel('Voltar ao Painel Principal')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:voltar:1365849508059287633>')
            )
        ],
        ephemeral: true
    }).catch(console.error);
}

module.exports = {
    handleInteraction,
    validateModConfig,
    showAutoModPanel,
    toggleAutoMod,
    configureSpamDetection,
    configureLinkFilter,
    configureMentionFilter,
    showWhitelistManager,
    showRoleManagerPanel,
    handleRoleAdd,
    handleRoleRemove,
    handleRoleClear,
    promptForCustomDomain,
    handleAddDomainModal
};