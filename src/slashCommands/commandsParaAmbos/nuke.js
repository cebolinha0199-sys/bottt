const { MessageFlags, SlashCommandBuilder, ChannelType, inlineCode } = require("discord.js");
const { JsonDatabase } = require("wio.db");
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" });
const { getCache } = require("../../../Functions/connect_api");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nuke")
        .setDescription("[💥] Nuke um canal")
        .addChannelOption(option =>
            option
                .setName("canal")
                .setDescription("Escolha o canal a ser nukeado")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText) // Apenas canais de texto
        ),

    async execute(interaction) {
        const userId = interaction.user.id;

        // Verifica se o usuário tem permissão para usar o comando
        const type = getCache(null, 'type');
        const dono = getCache(null, "owner");

        if (type?.Vendas?.status == false && type?.Ticket?.status == false) {
            return await interaction.editReply({
                content: `❌ | Você não possui acesso a nenhum de nossos sistemas, adquira um plano em nosso site. [CLIQUE AQUI](https://nevermissapps.com/dashboard) para ser redirecionado.`,
            });
        }

        const isVendas = (await dbPerms.get('vendas'))?.includes(interaction.user.id);
        const isTicket = (await dbPerms.get('ticket'))?.includes(interaction.user.id);
        const isOwner = interaction.user.id === dono;

        if (!isVendas && !isTicket && !isOwner) {
            return await interaction.editReply({
                content: `❌ | Você não tem permissão para usar este comando.`,
            });
        }

        // Pega o canal que foi mencionado no comando
        const channel = interaction.options.getChannel("canal");

        // Verifica se o canal é válido e se é um canal de texto
        if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                content: "Você precisa selecionar um canal de texto válido para nuke.",
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            // Pega as permissões do canal original
            const channelPermissions = channel.permissionOverwrites.cache.map(p => ({
                id: p.id,
                allow: p.allow.toArray(),
                deny: p.deny.toArray(),
            }));

            // Pega a categoria do canal original, se existir
            const parentId = channel.parentId;

            // Salva a posição atual do canal
            const channelPosition = channel.position;

            // Deleta o canal original
            await channel.delete();

            // Cria um novo canal com as mesmas configurações do original
            const newChannel = await interaction.guild.channels.create({
                name: channel.name,
                type: ChannelType.GuildText, // Criar como canal de texto
                parent: parentId || null, // Mantém a mesma categoria, se houver
                permissionOverwrites: channelPermissions.map(p => ({
                    id: p.id,
                    allow: p.allow,
                    deny: p.deny,
                })),
                topic: channel.topic, // Manter o tópico do canal original
                nsfw: channel.nsfw, // Manter configuração de NSFW
            });

            // Ajusta a posição do novo canal
            await newChannel.setPosition(channelPosition);

            // Envia a mensagem de "nuke" no novo canal
            await newChannel.send(`Nuked by ${inlineCode(interaction.user.username)}`);

            // Responde ao usuário confirmando a ação
            return interaction.reply({
                content: `Canal ${channel.name} foi nukeado e recriado com sucesso!`,
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: "❌ | Ocorreu um erro ao tentar nuke o canal.",
                flags: MessageFlags.Ephemeral
            });
        }
    },
};