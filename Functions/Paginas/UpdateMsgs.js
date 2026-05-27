
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js")
const { JsonDatabase } = require("wio.db")
const dbProducts = new JsonDatabase({ databasePath: "./databases/dbProducts.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" })
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" })
const dbPanels = new JsonDatabase({ databasePath: "./databases/dbPanels.json" });

const dinheiroEmoji = `<:dinheiro:${dbe.get('dinheiro')}>`;
const caixaEmoji = `<:caixa:${dbe.get('caixa')}>`;
const umEmoji = `<:um:${dbe.get('um')}>`;
const doisEmoji = `<:dois:${dbe.get('dois')}>`;
const tresEmoji = `<:tres:${dbe.get('tres')}>`;
const quatroEmoji = `<:quatro:${dbe.get('quatro')}>`;
const cincoEmoji = `<:cinco:${dbe.get('cinco')}>`;
const seisEmoji = `<:seis:${dbe.get('seis')}>`;
const seteEmoji = `<:sete:${dbe.get('sete')}>`;
const oitoEmoji = `<:oito:${dbe.get('oito')}>`;

let sharedUpdateQueue = {
    msgUpdates: new Set(),
    selectUpdates: new Set(),
};
let sharedDebounceTimer;

async function UpdateMsgs(client, productId) {
    sharedUpdateQueue.msgUpdates.add(productId);
    debounceSyncUpdate(client);
}

async function UpdateSelects(client, produtos) {
    sharedUpdateQueue.selectUpdates.add(produtos);
    debounceSyncUpdate(client);
}

function debounceSyncUpdate(client) {
    if (!sharedDebounceTimer) {
        sharedDebounceTimer = setTimeout(async () => {
            try {
                const productUpdates = Array.from(sharedUpdateQueue.msgUpdates);
                const selectUpdates = Array.from(sharedUpdateQueue.selectUpdates);

                // Limpar a fila de atualizações
                sharedUpdateQueue.msgUpdates.clear();
                sharedUpdateQueue.selectUpdates.clear();
                sharedDebounceTimer = null;

                // Processar atualizações apenas se houver itens
                const updatePromises = [];
                
                if (productUpdates.length > 0) {
                    updatePromises.push(batchUpdateMessages(client, productUpdates));
                }
                
                if (selectUpdates.length > 0) {
                    updatePromises.push(updatePanels(client, selectUpdates));
                }
                
                if (updatePromises.length > 0) {
                    await Promise.all(updatePromises);
                }
            } catch (error) {
                console.error("Erro no processamento de atualizações em lote:", error);
            }
        }, 5000);
    }
}

async function batchUpdateMessages(client, productIds) {
    try {
        let productsToUpdate;

        if (!productIds || productIds.length === 0 || (productIds.length === 1 && productIds[0] === null)) {
            productsToUpdate = await dbProducts.all();
        } else {
            productsToUpdate = await dbProducts.all().filter(product => productIds.includes(product.ID));
        }

        for (const productData of productsToUpdate) {
            // Verificar se o produto tem a estrutura de dados esperada
            if (!productData || !productData.data) {
                console.warn(`Produto inválido encontrado: ${JSON.stringify(productData)}`);
                continue; // Pular este produto
            }

            const messageLocation = productData.data.msgLocalization || {};
            
            // Verificar se temos informações de localização válidas
            if (!messageLocation.channelId || !messageLocation.messageId) {
                console.warn(`Localização de mensagem inválida para produto ${productData.ID}`);
                continue; // Pular este produto
            }

            // Obter dados do produto com fallbacks para evitar undefined
            const productColor = productData.data.color || "none";
            const productThumbnailUrl = productData.data.thumbUrl || "none";
            const productBannerUrl = productData.data.bannerUrl || "none";
            const productStock = Array.isArray(productData.data.stock) ? productData.data.stock : [];
            const productPrice = productData.data.price || "0";
            const productName = productData.data.name || "Produto sem nome";
            const productDescription = productData.data.description || "Sem descrição";

            // Obter configurações padrão
            const defaultThumbnail = await dbConfigs.get(`vendas.images.thumbUrl`) || "none";
            const defaultBanner = await dbConfigs.get(`vendas.images.bannerUrl`) || "none";
            const defaultEmbedColor = await dbConfigs.get(`vendas.embeds.color`) || "#460580";

            // Criar o embed do produto
            const productEmbed = new EmbedBuilder()
                .setAuthor({ name: productName })
                .setDescription(`${umEmoji}${doisEmoji}${tresEmoji}${quatroEmoji}${cincoEmoji}${seisEmoji}${seteEmoji}${oitoEmoji}\n\n${productDescription}`)
                .addFields(
                    { 
                        name: `Valor à vista`, 
                        value: `\`${Number(productPrice).toLocaleString(global.lenguage?.um || 'pt-BR', { style: 'currency', currency: global.lenguage?.dois || 'BRL' })}\``, 
                        inline: true 
                    },
                    { 
                        name: `Restam`, 
                        value: `\`${productStock.length}\``, 
                        inline: true 
                    }
                )
                .setColor(productColor !== "none" ? productColor : defaultEmbedColor !== "none" ? defaultEmbedColor : "#460580");

            // Adicionar thumbnail apenas se for válida
            if (productThumbnailUrl !== "none" && productThumbnailUrl) {
                productEmbed.setThumbnail(productThumbnailUrl);
            } else if (defaultThumbnail !== "none" && defaultThumbnail) {
                productEmbed.setThumbnail(defaultThumbnail);
            }

            // Adicionar banner apenas se for válido
            if (productBannerUrl !== "none" && productBannerUrl) {
                productEmbed.setImage(productBannerUrl);
            } else if (defaultBanner !== "none" && defaultBanner) {
                productEmbed.setImage(defaultBanner);
            }

            try {
                // Buscar o canal e a mensagem
                let messageChannel = await client.channels.fetch(messageLocation.channelId);
                let targetMessage = await messageChannel.messages.fetch(messageLocation.messageId);
                
                // Atualizar a mensagem
                await targetMessage.edit({ embeds: [productEmbed] });
                console.log(`Mensagem atualizada para o produto ${productData.ID}`);
            } catch (msgError) {
                console.error(`Erro ao atualizar mensagem para o produto ${productData.ID}:`, msgError.message);
            }
        }
    } catch (error) {
        console.error("Erro ao processar atualização em lote de mensagens:", error);
    }
}


async function updatePanels(client, uniqueProdutos) {
    try {
        let allPanels;

        if (!uniqueProdutos || uniqueProdutos.length === 0 || (uniqueProdutos.length === 1 && uniqueProdutos[0] === null)) {
            allPanels = dbPanels.all();
        } else {
            allPanels = dbPanels.all().filter(panel => {
                return panel.data && panel.data.products && 
                       Object.keys(panel.data.products).some(prod => uniqueProdutos.includes(prod));
            });
        }

        if (!allPanels || allPanels.length === 0) {
            console.log("Nenhum painel para atualizar");
            return;
        }

        for (let i = 0; i < allPanels.length; i++) {
            const panel = allPanels[i];
            
            // Verificar se o painel tem a estrutura esperada
            if (!panel || !panel.data || !panel.data.products || !panel.ID) {
                console.warn("Painel inválido encontrado:", panel);
                continue;
            }
            
            // Verificar se temos informações de localização válidas
            if (!panel.data.msgLocalization || 
                !panel.data.msgLocalization.channelId || 
                !panel.data.msgLocalization.messageId) {
                console.warn(`Localização de mensagem inválida para painel ${panel.ID}`);
                continue;
            }
            
            const productIds = Object.keys(panel.data.products);
            let allOptions = [];

            for (const pId of productIds) {
                // Obter detalhes do produto
                const productDetails = dbProducts.get(pId);
                
                // Pular produtos que não existem
                if (!productDetails) {
                    console.warn(`Produto ${pId} não encontrado no banco de dados`);
                    continue;
                }
                
                // Verificar se o stock existe e é um array
                const stockLength = Array.isArray(productDetails.stock) ? productDetails.stock.length : 0;
                
                // Obter emoji do produto no painel
                const emojiP = await dbPanels.get(`${panel.ID}.products.${pId}.emoji`) || "🛒";
                
                // Adicionar opção ao select menu
                allOptions.push({
                    label: productDetails.name || `Produto ${pId}`,
                    emoji: emojiP,
                    description: `💸 Valor: ${Number(productDetails.price || 0).toLocaleString(global.lenguage?.um || 'pt-BR', { style: 'currency', currency: global.lenguage?.dois || 'BRL' })} | 📦 Estoque: ${stockLength}`,
                    value: pId
                });
            }

            // Verificar se temos opções para mostrar
            if (allOptions.length === 0) {
                console.warn(`Painel ${panel.ID} não tem produtos válidos para exibir`);
                continue;
            }
            
            // Limitar opções para evitar erros do Discord (máximo 25)
            if (allOptions.length > 25) {
                console.warn(`Painel ${panel.ID} tem mais de 25 opções, limitando...`);
                allOptions = allOptions.slice(0, 25);
            }

            // Obter configurações do painel
            const placeholderP = await dbPanels.get(`${panel.ID}.selectMenu.placeholder`) || "Selecione um produto";
            const titleP = panel.data.embed?.title || "Painel de Produtos";
            const descriptionP = panel.data.embed?.description || "Selecione um produto abaixo";
            const colorP = panel.data.embed?.color || "none";
            const bannerP = panel.data.embed?.bannerUrl || "none";
            const thumbP = panel.data.embed?.thumbUrl || "none";
            const footerP = panel.data.embed?.footer || "none";

            // Criar componente de select menu
            const rowPanel = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(panel.ID)
                        .setPlaceholder(placeholderP)
                        .addOptions(allOptions)
                );

            // Criar embed do painel
            const embedPanel = new EmbedBuilder()
                .setAuthor({ name: titleP })
                .setDescription(`${umEmoji}${doisEmoji}${tresEmoji}${quatroEmoji}${cincoEmoji}${seisEmoji}${seteEmoji}${oitoEmoji}\n\n${descriptionP}`)
                .setColor(colorP !== "none" ? colorP : "#460580")
                .setFooter({ text: footerP !== "none" ? footerP : " " });

            // Adicionar thumbnail e banner apenas se forem válidos
            if (thumbP !== "none" && thumbP) {
                embedPanel.setThumbnail(thumbP);
            }
            
            if (bannerP !== "none" && bannerP) {
                embedPanel.setImage(bannerP);
            }

            try {
                // Buscar canal e mensagem
                let channel = await client.channels.fetch(panel.data.msgLocalization.channelId);
                let message = await channel.messages.fetch(panel.data.msgLocalization.messageId);
                
                // Atualizar a mensagem
                await message.edit({ embeds: [embedPanel], components: [rowPanel] });
                console.log(`Painel ${panel.ID} atualizado com sucesso`);
            } catch (msgError) {
                console.error(`Erro ao atualizar mensagem para o painel ${panel.ID}:`, msgError.message);
            }
        }
    } catch (error) {
        console.error("Erro ao processar atualização de painéis:", error);
    }
}

module.exports = {
    UpdateMsgs,
    UpdateSelects
}