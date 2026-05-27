// utils/roleManager.js
async function showRoleManagerPanel(interaction, guildConfig, type) {
    const configMap = {
        spam: {
            title: '🔄 Cargos Isentos - Detecção de Spam',
            path: 'spamDetection',
            returnCommand: 'mod_automod_spam'
        },
        link: {
            title: '🔗 Cargos Isentos - Filtro de Links',
            path: 'linkFilter',
            returnCommand: 'mod_automod_links'
        },
        mention: {
            title: '📢 Cargos Isentos - Filtro de Menções',
            path: 'mentionFilter',
            returnCommand: 'mod_automod_mentions'
        }
    };

    const config = configMap[type];
    const currentConfig = guildConfig.autoMod[config.path];

    // Garantir que whitelistedRoles existe
    if (!currentConfig.whitelistedRoles) {
        currentConfig.whitelistedRoles = [];
        await saveConfig(interaction.guild.id, guildConfig);
    }

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

    // Select menu para adicionar cargos
    const addRoleSelect = new StringSelectMenuBuilder()
        .setCustomId(`mod_automod_${type}_role_add`)
        .setPlaceholder('Selecione cargos para adicionar')
        .setMinValues(1)
        .setMaxValues(10);

    // Preencher com cargos do servidor
    const serverRoles = interaction.guild.roles.cache
        .filter(role => 
            role.id !== interaction.guild.id && // Excluir @everyone
            !currentConfig.whitelistedRoles.includes(role.id) // Excluir cargos já isentos
        )
        .sort((a, b) => b.position - a.position);

    if (serverRoles.size > 0) {
        addRoleSelect.addOptions(
            serverRoles.map(role => ({
                label: role.name,
                value: role.id,
                description: `Adicionar ${role.name} aos cargos isentos`,
                emoji: '➕'
            }))
        );
    }

    // Select menu para remover cargos
    const removeRoleSelect = new StringSelectMenuBuilder()
        .setCustomId(`mod_automod_${type}_role_remove`)
        .setPlaceholder('Selecione cargos para remover')
        .setMinValues(1)
        .setMaxValues(10);

    if (currentConfig.whitelistedRoles.length > 0) {
        removeRoleSelect.addOptions(
            currentConfig.whitelistedRoles.map(roleId => {
                const role = interaction.guild.roles.cache.get(roleId);
                return {
                    label: role ? role.name : 'Cargo Desconhecido',
                    value: roleId,
                    description: `Remover ${role ? role.name : 'cargo'} dos isentos`,
                    emoji: '➖'
                };
            })
        );
    }

    // Botões de ação
    const clearButton = new ButtonBuilder()
        .setCustomId(`mod_automod_${type}_role_clear`)
        .setLabel('Limpar Todos')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
        .setDisabled(currentConfig.whitelistedRoles.length === 0);

    const backButton = new ButtonBuilder()
        .setCustomId(config.returnCommand)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:voltar:1365849508059287633>');

    // Montar as rows
    const rows = [];
    
    if (serverRoles.size > 0) {
        rows.push(new ActionRowBuilder().addComponents(addRoleSelect));
    }
    
    if (currentConfig.whitelistedRoles.length > 0) {
        rows.push(new ActionRowBuilder().addComponents(removeRoleSelect));
    }
    
    rows.push(new ActionRowBuilder().addComponents(clearButton, backButton));

    await interaction.update({
        embeds: [embed],
        components: rows,
        ephemeral: true
    });
}

// Funções de manipulação de cargos
async function handleRoleAdd(interaction, guildConfig, type) {
    const configPath = type === 'spam' ? 'spamDetection' : 
                      type === 'link' ? 'linkFilter' : 'mentionFilter';
    
    const selectedRoles = interaction.values;
    const currentConfig = guildConfig.autoMod[configPath];

    currentConfig.whitelistedRoles = [
        ...new Set([...currentConfig.whitelistedRoles, ...selectedRoles])
    ];

    await saveConfig(interaction.guild.id, guildConfig);
    await showRoleManagerPanel(interaction, guildConfig, type);
}

async function handleRoleRemove(interaction, guildConfig, type) {
    const configPath = type === 'spam' ? 'spamDetection' : 
                      type === 'link' ? 'linkFilter' : 'mentionFilter';
    
    const selectedRoles = interaction.values;
    const currentConfig = guildConfig.autoMod[configPath];

    currentConfig.whitelistedRoles = currentConfig.whitelistedRoles.filter(
        roleId => !selectedRoles.includes(roleId)
    );

    await saveConfig(interaction.guild.id, guildConfig);
    await showRoleManagerPanel(interaction, guildConfig, type);
}

async function handleRoleClear(interaction, guildConfig, type) {
    const configPath = type === 'spam' ? 'spamDetection' : 
                      type === 'link' ? 'linkFilter' : 'mentionFilter';

    const confirmButton = new ButtonBuilder()
        .setCustomId(`mod_automod_${type}_role_clear_confirm`)
        .setLabel('Confirmar Limpeza')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⚠️');

    const cancelButton = new ButtonBuilder()
        .setCustomId(`mod_automod_${type}_role_clear_cancel`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✖️');

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    await interaction.update({
        content: '⚠️ Tem certeza que deseja remover todos os cargos isentos? Esta ação não pode ser desfeita!',
        components: [row],
        ephemeral: true
    });
}

async function handleRoleClearConfirm(interaction, guildConfig, type) {
    const configPath = type === 'spam' ? 'spamDetection' : 
                      type === 'link' ? 'linkFilter' : 'mentionFilter';

    guildConfig.autoMod[configPath].whitelistedRoles = [];
    await saveConfig(interaction.guild.id, guildConfig);
    await showRoleManagerPanel(interaction, guildConfig, type);
}

module.exports = {
    showRoleManagerPanel,
    handleRoleAdd,
    handleRoleRemove,
    handleRoleClear,
    handleRoleClearConfirm
};