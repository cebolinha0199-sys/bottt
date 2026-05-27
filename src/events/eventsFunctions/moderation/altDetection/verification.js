const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputComponent, TextInputBuilder, TextInputStyle } = require('discord.js');

/**
 * Inicia o processo de verificação para um membro
 * @param {GuildMember} member - Membro do servidor
 * @param {Object} guildConfig - Configuração do servidor
 */
async function startVerification(member, guildConfig) {
    try {
        // Criar cargo temporário se não existir
        const verifyRole = await ensureVerificationRole(member.guild);

        // Aplicar cargo temporário
        await member.roles.add(verifyRole);

        // Gerar código de verificação
        const verificationCode = generateVerificationCode();

        // Criar embed de verificação
        const embed = new EmbedBuilder()
            .setTitle('🔒 Verificação de Segurança')
            .setDescription(`Olá ${member.user.username}!\nPor favor, complete a verificação para acessar o servidor.`)
            .setColor('#2F3136')
            .addFields(
                { name: 'Código de Verificação', value: verificationCode, inline: true },
                { name: 'Tempo Restante', value: '10 minutos', inline: true }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`verify_submit_${member.id}`)
                .setLabel('Verificar')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✅')
        );

        // Enviar mensagem de verificação
        const msg = await member.send({
            embeds: [embed],
            components: [row]
        });

        // Armazenar dados de verificação
        require('./index').verificationCache.set(member.id, {
            code: verificationCode,
            timestamp: Date.now(),
            messageId: msg.id,
            guildId: member.guild.id
        });

        // Configurar timeout
        setTimeout(() => {
            handleVerificationTimeout(member);
        }, 600000); // 10 minutos

    } catch (error) {
        console.error('Erro ao iniciar verificação:', error);
    }
}

/**
 * Manipula interações de verificação
 * @param {Interaction} interaction - Interação do Discord
 * @param {Map} verificationCache - Cache de verificações
 */

async function handleVerificationInteraction(interaction, verificationCache) {
    try {
        const [, action, userId] = interaction.customId.split('_');

        if (action === 'submit') {
            // Criar o modal
            const modal = new ModalBuilder()
                .setCustomId(`verify_code_${userId}`)
                .setTitle('Verificação de Segurança');

            const codeInput = new TextInputBuilder()
                .setCustomId('verificationCode')
                .setLabel('Digite o código de verificação')
                .setStyle(TextInputStyle.Short)
                .setMinLength(6)
                .setMaxLength(6)
                .setRequired(true);

            const row = new ActionRowBuilder().addComponents(codeInput);
            modal.addComponents(row);

            // Mostrar o modal para o usuário
            await interaction.showModal(modal);

            // Criar o coletor para esperar o envio do modal
            const submitted = await interaction.awaitModalSubmit({
                time: 60_000, // 60 segundos para responder
                filter: i => i.customId === `verify_code_${userId}` && i.user.id === interaction.user.id,
            }).catch(() => null);

            if (!submitted) {
                return interaction.followUp({ content: '⏰ Tempo para verificação expirado.', ephemeral: true });
            }

            // Pegar o código enviado
            const submittedCode = submitted.fields.getTextInputValue('verificationCode');
            const verificationData = verificationCache.get(userId);

            if (!verificationData) {
                return submitted.reply({
                    content: '❌ Verificação expirada ou não encontrada. Solicite um novo código.',
                    ephemeral: true
                });
            }

            if (submittedCode === verificationData.code) {
                const guild = interaction.client.guilds.cache.get(verificationData.guildId);
                const member = await guild.members.fetch(userId);

                const verifyRole = guild.roles.cache.find(r => r.name === 'Aguardando Verificação');
                if (verifyRole) {
                    await member.roles.remove(verifyRole);
                }

                await interaction.deleteReply({
                    content: '✅ Verificação concluída com sucesso! Bem-vindo ao servidor.',
                    ephemeral: true,
                    message: interaction.message
                });

                await submitted.reply({
                    content: '✅ Verificação concluída com sucesso! Bem-vindo ao servidor.',
                    ephemeral: true
                });

                verificationCache.delete(userId);
            } else {
                await submitted.reply({
                    content: '❌ Código incorreto. Por favor, tente novamente.',
                    ephemeral: true
                });
            }

        }
    } catch (error) {
        console.error('Erro ao processar verificação:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'Ocorreu um erro ao processar sua verificação.',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: 'Ocorreu um erro ao processar sua verificação.',
                ephemeral: true
            });
        }
    }
}


/**
 * Gera um código de verificação aleatório
 * @returns {string} Código de verificação
 */
function generateVerificationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Garante que existe um cargo de verificação
 * @param {Guild} guild - Servidor do Discord
 * @returns {Promise<Role>} Cargo de verificação
 */
async function ensureVerificationRole(guild) {
    let role = guild.roles.cache.find(r => r.name === 'Aguardando Verificação');

    if (!role) {
        role = await guild.roles.create({
            name: 'Aguardando Verificação',
            color: '#808080',
            permissions: []
        });
    }

    return role;
}

/**
 * Manipula timeout de verificação
 * @param {GuildMember} member - Membro do servidor
 */
async function handleVerificationTimeout(member) {
    const verificationData = require('./index').verificationCache.get(member.id);

    if (verificationData) {
        require('./index').verificationCache.delete(member.id);

        try {
            await member.send('⚠️ Seu tempo de verificação expirou. Por favor, entre no servidor novamente para tentar novamente.');
            await member.kick('Tempo de verificação expirado');
        } catch (error) {
            console.error('Erro ao processar timeout de verificação:', error);
        }
    }
}

module.exports = {
    startVerification,
    handleVerificationInteraction
};