const { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, ActivityType, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType, ComponentType } = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const dbPerms = new JsonDatabase({ databasePath: "./databases/dbPermissions.json" })
const dbEmojis = new JsonDatabase({ databasePath: "./databases/emojis.json" })

async function permsConfigTicket(client, interaction) {
    var perms = '';
    const mapPerms = dbPerms.all().filter(ticket => ticket.ID == "ticket")
    const users = mapPerms.map((t) => t.data)

    try {
        perms = Object.entries(users[0]).map(([key, value]) => `<@${value}>`).join('\n')
    } catch (error) { }

    const embed = new EmbedBuilder()
        .setTitle(`Configurando Perms - Ticket`)
        .setDescription(`Veja a lista de pessoas com permissão de gerenciar o seu bot de Ticket à seguir e também interaja com os botões abaixo da lista para **ADICIONAR** ou **REMOVER** permissões.\n\n${perms}`)
        .setColor(dbConfigs.get(`color`) || "Default")

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setStyle(3)
                .setCustomId(`add_perm_ticket`)
                .setLabel(`Adicionar Usuário`)
                .setEmoji(dbEmojis.get(`20`)),
            new ButtonBuilder()
                .setStyle(4)
                .setCustomId(`sub_perm_tickets`)
                .setLabel(`Remover Usuário`)
                .setEmoji(dbEmojis.get(`21`)),
        )

    interaction.reply({ embeds: [embed], components: [row] }).then(async msg12 => {
        const filter = (a) => a.user.id === interaction.user.id;
        const collector = msg12.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter
        })

        collector.on("collect", async (interaction) => {
            if (interaction.customId === "add_perm_ticket") {
                const modalAddPerm = new ModalBuilder()
                    .setCustomId(`add_perm_ticket_modal`)
                    .setTitle('Adicionar Permissão | TICKET')
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('addPermTicket')
                                    .setLabel("Adicionar")
                                    .setMinLength(15)
                                    .setPlaceholder(`Adicione o ID do membro`)
                                    .setStyle(1)
                            )
                    );
                await interaction.showModal(modalAddPerm);
            }

            if (interaction.customId === "sub_perm_tickets") {
                const modalRemovePerm = new ModalBuilder()
                    .setCustomId(`sub_perm_tickets_modal`)
                    .setTitle('Remover Permissão | TICKET')
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('removePermTicket')
                                    .setLabel("Remover")
                                    .setMinLength(15)
                                    .setPlaceholder(`Adicione o ID do membro`)
                                    .setStyle(1)
                            )
                    );
                await interaction.showModal(modalRemovePerm);
            }

            client.once("interactionCreate", async (interaction) => {
                if (interaction.isModalSubmit() && interaction.customId === "add_perm_ticket_modal") {
                    try {
                        const text = interaction.fields.getTextInputValue("addPermTicket");
                        await interaction.guild.members.fetch();
                        const user = interaction.guild.members.cache.get(text)

                        if (!user) {
                            await interaction.channel.send(`${dbEmojis.get(`13`)} | Usuário não encontrado!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000)
                                interaction.deferUpdate()
                            })
                            return
                        }

                        if (await dbPerms.get(`ticket`)?.includes(user.user.id)) {
                            await interaction.channel.send(`${dbEmojis.get(`1`)} | O usário ${user} já possui permissão para utilizar os comandos do bot TICKET!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                                interaction.deferUpdate()
                            })
                            return;
                        }

                        if (user) {
                            dbPerms.push(`ticket`, text)
                            var perms = '';
                            const mapPerms = dbPerms.all().filter(ticket => ticket.ID == "ticket")
                            const users = mapPerms.map((t) => t.data)

                            perms = Object.entries(users[0]).map(([key, value]) => `<@${value}>`).join('\n');

                            const embed = new EmbedBuilder()
                                .setTitle(`Configurando Perms - Ticket`)
                                .setDescription(`Veja a lista de pessoas com permissão de gerenciar o seu bot de Ticket à seguir e também interaja com os botões abaixo da lista para **ADICIONAR** ou **REMOVER** permissões.\n\n${perms}`)
                                .setColor(dbConfigs.get(`color`) || "Default")

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(3)
                                        .setCustomId(`add_perm_ticket`)
                                        .setLabel(`Adicionar Usuário`)
                                        .setEmoji(dbEmojis.get(`20`)),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`sub_perm_tickets`)
                                        .setLabel(`Remover Usuário`)
                                        .setEmoji(dbEmojis.get(`21`)),
                                )
                            await msg12.edit({ embeds: [embed], components: [row] })
                            interaction.channel.send(`${dbEmojis.get(`6`)} | Permissão para manipular o bot **TICKET** adicionada ao usuário ${user}!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })
                            interaction.deferUpdate()
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }

                if (interaction.isModalSubmit() && interaction.customId === "sub_perm_tickets_modal") {
                    try {
                        const text = interaction.fields.getTextInputValue("removePermTicket");
                        await interaction.guild.members.fetch();
                        const user = interaction.guild.members.cache.get(text)

                        if (!user) {
                            await interaction.channel.send(`${dbEmojis.get(`13`)} | Usuário não encontrado!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000)
                                interaction.deferUpdate()
                            })
                            return
                        }

                        if (!await dbPerms.get(`ticket`)?.includes(user.user.id)) {
                            await interaction.channel.send(`${dbEmojis.get(`1`)} | O usário ${user} já não possui permissão para utilizar os comandos do bot TICKET!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                                interaction.deferUpdate()
                            })
                            return;
                        }

                        if (user) {
                            dbPerms.pull(`ticket`, (userRemove) => userRemove === user.user.id)
                            var perms = '';
                            const mapPerms = dbPerms.all().filter(ticket => ticket.ID == "ticket")
                            const users = mapPerms.map((t) => t.data)

                            perms = Object.entries(users[0]).map(([key, value]) => `<@${value}>`).join('\n');

                            const embed = new EmbedBuilder()
                                .setTitle(`Configurando Perms - Ticket`)
                                .setDescription(`Veja a lista de pessoas com permissão de gerenciar o seu bot de Ticket à seguir e também interaja com os botões abaixo da lista para **ADICIONAR** ou **REMOVER** permissões.\n\n${perms}`)
                                .setColor(dbConfigs.get(`color`) || "Default")

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(3)
                                        .setCustomId(`add_perm_ticket`)
                                        .setLabel(`Adicionar Usuário`)
                                        .setEmoji(dbEmojis.get(`20`)),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`sub_perm_tickets`)
                                        .setLabel(`Remover Usuário`)
                                        .setEmoji(dbEmojis.get(`21`)),
                                )
                            await msg12.edit({ embeds: [embed], components: [row] })
                            interaction.channel.send(`${dbEmojis.get(`6`)} | Permissão para manipular o bot **TICKET** removida do usuário ${user}!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })
                            interaction.deferUpdate()
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }
            })
        })
    })
}
//permsConfigVendas
async function permsConfigVendas(client, interaction) {
    var perms = '';
    const mapPerms = dbPerms.all().filter(vendas => vendas.ID == "vendas")
    const users = mapPerms.map((t) => t.data)

    try {
        perms = Object.entries(users[0]).map(([key, value]) => `<@${value}>`).join('\n')
    } catch (error) { }

    const embed = new EmbedBuilder()
        .setTitle(`Configurando Perms - Vendas`)
        .setDescription(`Veja a lista de pessoas com permissão de gerenciar o seu bot de Vendas à seguir e também interaja com os botões abaixo da lista para **ADICIONAR** ou **REMOVER** permissões.\n\n${perms}`)
        .setColor(dbConfigs.get(`color`) || "Default")

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setStyle(3)
                .setCustomId(`add_perm_vendas`)
                .setLabel(`Adicionar Usuário`)
                .setEmoji(dbEmojis.get(`20`)),
            new ButtonBuilder()
                .setStyle(4)
                .setCustomId(`sub_perm_vendas`)
                .setLabel(`Remover Usuário`)
                .setEmoji(dbEmojis.get(`21`)),
        )

    interaction.reply({ embeds: [embed], components: [row] }).then(async msg12 => {
        const filter = (a) => a.user.id === interaction.user.id;
        const collector = msg12.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter
        })

        collector.on("collect", async (interaction) => {
            if (interaction.customId === "add_perm_vendas") {
                const modalAddPerm = new ModalBuilder()
                    .setCustomId(`add_perm_vendas_modal`)
                    .setTitle('Adicionar Permissão | VENDAS')
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('addPermVendas')
                                    .setLabel("Adicionar")
                                    .setMinLength(15)
                                    .setPlaceholder(`Adicione o ID do membro`)
                                    .setStyle(1)
                            )
                    );
                await interaction.showModal(modalAddPerm);
            }

            if (interaction.customId === "sub_perm_vendas") {
                const modalRemovePerm = new ModalBuilder()
                    .setCustomId(`sub_perm_vendas_modal`)
                    .setTitle('Remover Permissão | VENDAS')
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('removePermVendas')
                                    .setLabel("Remover")
                                    .setMinLength(15)
                                    .setPlaceholder(`Adicione o ID do membro`)
                                    .setStyle(1)
                            )
                    );
                await interaction.showModal(modalRemovePerm);
            }

            client.once("interactionCreate", async (interaction) => {
                if (interaction.isModalSubmit() && interaction.customId === "add_perm_vendas_modal") {
                    try {
                        const text = interaction.fields.getTextInputValue("addPermVendas");
                        await interaction.guild.members.fetch();
                        const user = interaction.guild.members.cache.get(text)

                        if (!user) {
                            await interaction.channel.send(`${dbEmojis.get(`13`)} | Usuário não encontrado!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000)
                                interaction.deferUpdate()
                            })
                            return
                        }

                        if (await dbPerms.get(`vendas`)?.includes(user.user.id)) {
                            await interaction.channel.send(`${dbEmojis.get(`1`)} | O usário ${user} já possui permissão para utilizar os comandos do bot VENDAS!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                                interaction.deferUpdate()
                            })
                            return;
                        }

                        if (user) {
                            dbPerms.push(`vendas`, text)
                            var perms = '';
                            const mapPerms = dbPerms.all().filter(vendas => vendas.ID == "vendas")
                            const users = mapPerms.map((t) => t.data)

                            perms = Object.entries(users[0]).map(([key, value]) => `<@${value}>`).join('\n');

                            const embed = new EmbedBuilder()
                                .setTitle(`Configurando Perms - Vendas`)
                                .setDescription(`Veja a lista de pessoas com permissão de gerenciar o seu bot de Vendas à seguir e também interaja com os botões abaixo da lista para **ADICIONAR** ou **REMOVER** permissões.\n\n${perms}`)
                                .setColor(dbConfigs.get(`color`) || "Default")

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(3)
                                        .setCustomId(`add_perm_vendas`)
                                        .setLabel(`Adicionar Usuário`)
                                        .setEmoji(dbEmojis.get(`20`)),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`sub_perm_vendas`)
                                        .setLabel(`Remover Usuário`)
                                        .setEmoji(dbEmojis.get(`21`)),
                                )
                            await msg12.edit({ embeds: [embed], components: [row] })
                            interaction.channel.send(`${dbEmojis.get(`6`)} | Permissão para manipular o bot **VENDAS** adicionada ao usuário ${user}!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })
                            interaction.deferUpdate()
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }

                if (interaction.isModalSubmit() && interaction.customId === "sub_perm_vendas_modal") {
                    try {
                        const text = interaction.fields.getTextInputValue("removePermVendas");
                        await interaction.guild.members.fetch();
                        const user = interaction.guild.members.cache.get(text)

                        if (!user) {
                            await interaction.channel.send(`${dbEmojis.get(`13`)} | Usuário não encontrado!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000)
                                interaction.deferUpdate()
                            })
                            return
                        }

                        if (!await dbPerms.get(`vendas`)?.includes(user.user.id)) {
                            await interaction.channel.send(`${dbEmojis.get(`1`)} | O usário ${user} já não possui permissão para utilizar os comandos do bot VENDAS!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                                interaction.deferUpdate()
                            })
                            return;
                        }

                        if (user) {
                            dbPerms.pull(`vendas`, (userRemove) => userRemove === user.user.id)
                            var perms = '';
                            const mapPerms = dbPerms.all().filter(vendas => vendas.ID == "vendas")
                            const users = mapPerms.map((t) => t.data)

                            perms = Object.entries(users[0]).map(([key, value]) => `<@${value}>`).join('\n');

                            const embed = new EmbedBuilder()
                                .setTitle(`Configurando Perms - VENDAS`)
                                .setDescription(`Veja a lista de pessoas com permissão de gerenciar o seu bot de Vendas à seguir e também interaja com os botões abaixo da lista para **ADICIONAR** ou **REMOVER** permissões.\n\n${perms}`)
                                .setColor(dbConfigs.get(`color`) || "Default")

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setStyle(3)
                                        .setCustomId(`add_perm_vendas`)
                                        .setLabel(`Adicionar Usuário`)
                                        .setEmoji(dbEmojis.get(`20`)),
                                    new ButtonBuilder()
                                        .setStyle(4)
                                        .setCustomId(`sub_perm_vendas`)
                                        .setLabel(`Remover Usuário`)
                                        .setEmoji(dbEmojis.get(`21`)),
                                )
                            await msg12.edit({ embeds: [embed], components: [row] })
                            interaction.channel.send(`${dbEmojis.get(`6`)} | Permissão para manipular o bot **VENDAS** removida do usuário ${user}!`).then(msg => {
                                setTimeout(() => {
                                    msg.delete().catch(error => { })
                                }, 5000);
                            })
                            interaction.deferUpdate()
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }
            })
        })
    })
}

module.exports = {
    permsConfigTicket,
    permsConfigVendas
}