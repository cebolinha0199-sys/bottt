const { default: axios } = require("axios")
const { MessageFlags, ActionRowBuilder, ButtonBuilder } = require("discord.js")

const { JsonDatabase } = require("wio.db");
const dbe = new JsonDatabase({ databasePath: "./databases/emojis-globais.json" });
const dbOpenedCarts = new JsonDatabase({ databasePath: "./databases/dbOpenedCarts.json" })
const dbConfigs = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });


async function ConfigEfíStart(client, interaction) {

    let efitoggle = await dbConfigs.get(`vendas.payments.paymentsOptions.EfiBank`) 

    let message = `## Configuração do Efí Bank\n- Status do Sistema: ${efitoggle == null ? '\`Desativado\`' : efitoggle == true ? '\`Ativado\`' : '\`Desativado\`'}`

    let components1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('EfíBankStatus')
                .setLabel('Ativar/Desativar Efí Bank')
                .setStyle(2)
        )
    let components2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('EfíBankConfig')
                .setLabel('Autorizar Efí Bank')
                .setStyle(1)
        )

    return { content: message, flags: [MessageFlags.Ephemeral], components: [components1, components2] }
}

const https = require("https");


async function UpdatePix(chave, certificado, token) {
    const agent = new https.Agent({
        pfx: certificado,
        passphrase: '',
    });

    try {
        const payload = {
            "pix": {
                "receberSemChave": true,
                "chaves": {
                    [chave]: {
                        "recebimento": {
                            "txidObrigatorio": false,
                            "qrCodeEstatico": {
                                "recusarTodos": false
                            },
                            "webhook": {
                                "notificacao": {
                                    "tarifa": true,
                                    "pagador": true
                                }
                            }
                        }
                    }
                }
            }
        };

        await axios.put(
            'https://pix.api.efipay.com.br/v2/gn/config',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "x-skip-mtls-checking": true,
                },
                httpsAgent: agent,
            }
        );

    } catch (error) {
        console.error("Erro ao atualizar configuração do webhook:", error.response ? error.response.data : error.message);
    }
}
const fs = require("fs");
const path = require("path");
async function GenerateToken(clientid, clientsecret, certificado, client) {
    if (clientid == null || clientsecret == null || certificado == null) {
        clientid = await dbConfigs.get(`vendas.payments.EfiBankClientID`)
        clientsecret = await dbConfigs.get(`vendas.payments.EfiBankClientSecret`) 
        let namecertificado = await dbConfigs.get(`vendas.payments.EfiBankCertificado`) 
        try {
            const certificadoPath = path.join(`./databases/${namecertificado}`);
            const certificadoBuffer = fs.readFileSync(certificadoPath);


            certificado = certificadoBuffer
        } catch (error) {
            await dbConfigs.delete(`vendas.payments.EfiBankClientID`)
            await dbConfigs.delete(`vendas.payments.EfiBankClientSecret`)
            return 
        }

    }

    const agent = new https.Agent({ pfx: certificado, passphrase: "" });

    const authData = Buffer.from(`${clientid}:${clientsecret}`).toString("base64");

    const tokenResponse = await axios.post(
        "https://pix.api.efipay.com.br/oauth/token",
        JSON.stringify({ grant_type: "client_credentials" }),
        {
            headers: {
                Authorization: `Basic ${authData}`,
                "Content-Type": "application/json",
            },
            httpsAgent: agent,
        }
    );


    global.tokenefi = tokenResponse.data.access_token;
    return tokenResponse.data.access_token;

}

async function SetCallBack(client) {
    let certificado
    let namecertificado = await dbConfigs.get(`vendas.payments.EfiBankCertificado`) 
    try {
        certificado = fs.readFileSync(`./databases/${namecertificado}`);
    } catch (error) {
        await dbConfigs.delete(`vendas.payments.EfiBankClientID`)
        await dbConfigs.delete(`vendas.payments.EfiBankClientSecret`)
        return 
    }
    const agent = new https.Agent({

        pfx: certificado,
        passphrase: '', // Add passphrase if required
    });

    const chave = await dbConfigs.get(`vendas.payments.EfiBankChavePix`) 

    const response = await axios.put(
        `https://pix.api.efipay.com.br/v2/webhook/${chave}`,
        {
            webhookUrl: "https://promisseapi.squareweb.app/efibank/callback?ignorar=",
        },
        {
            headers: {
                Authorization: `Bearer ${global.tokenefi}`,
                "Content-Type": "application/json",
                "x-skip-mtls-checking": true,
            },
            httpsAgent: agent,
        }
    );
    return true

}




async function createCobEfi(price, desc, username, client) {
    let certificado
    let namecertificado = await dbConfigs.get(`vendas.payments.EfiBankCertificado`) 
    try {
        certificado = fs.readFileSync(`./databases/${namecertificado}`);
    } catch (error) {
        await dbConfigs.delete(`vendas.payments.EfiBankClientID`)
        await dbConfigs.delete(`vendas.payments.EfiBankClientSecret`)
        return 
    }

    const agent = new https.Agent({
        pfx: certificado,
        passphrase: '',
    });
    let chave = String(await dbConfigs.get(`vendas.payments.EfiBankChavePix`) )
    let precoString = price == 0 ? '0.01' : price.toFixed(2);

    const data = {
        calendario: {
            expiracao: 3600
        },
        devedor: {
            cpf: '12345678909',
            nome: username
        },
        valor: {
            original: `${precoString}`
        },
        chave: chave,
        solicitacaoPagador: desc
    };


    const config = {
        method: 'POST',
        url: 'https://pix.api.efipay.com.br/v2/cob',
        headers: {
            Authorization: `Bearer ${global.tokenefi}`,
            'Content-Type': 'application/json',
        },
        httpsAgent: agent,
        data: data,
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.log(error)
        //console.error('Erro ao criar cobrança:', error.response ? error.response.data : error.message);
    }
}

async function generateQRCode(locID, client) {


    let namecertificado = await dbConfigs.get(`vendas.payments.EfiBankCertificado`) 
    let certificado
    try {
        certificado = fs.readFileSync(`./databases/${namecertificado}`);
    } catch (error) {
        await dbConfigs.delete(`vendas.payments.EfiBankClientID`)
        await dbConfigs.delete(`vendas.payments.EfiBankClientSecret`)
        return 
    }
    const agent = new https.Agent({
        pfx: certificado,
        passphrase: '',
    });

    const config = {
        method: 'GET',
        url: `https://pix.api.efipay.com.br/v2/loc/${locID}/qrcode`,
        headers: {
            Authorization: `Bearer ${global.tokenefi}`,
            'Content-Type': 'application/json',
        },
        httpsAgent: agent,
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error.response ? error.response.data : error.message);
    }
}


async function ReembolsoEfi(txid, client) {
    let namecertificado = await dbConfigs.get(`vendas.payments.EfiBankCertificado`)
    let certificado
    try {
        certificado = fs.readFileSync(`./databases/${namecertificado}`);
    } catch (error) {
        await dbConfigs.delete(`vendas.payments.EfiBankClientID`)
        await dbConfigs.delete(`vendas.payments.EfiBankClientSecret`)
        return 
    }
    const agent = new https.Agent({
        pfx: certificado,
        passphrase: '',
    });

    const config = {
        method: 'GET',
        url: `https://pix.api.efipay.com.br/v2/cob/${txid}`,
        headers: {
            Authorization: `Bearer ${global.tokenefi}`,
            'Content-Type': 'application/json',
        },
        httpsAgent: agent,
    };
    let endtoendid 
    let valor 
    try {
        const response = await axios(config);
        endtoendid = response.data.pix[0].endToEndId
        valor = response.data.valor.original
    } catch (error) {
        console.error('Erro ao reembolsar pagamento:', error.response ? error.response.data : error.message);
    }

    const config2 = {
        method: 'PUT',
        url: `https://pix.api.efipay.com.br/v2/pix/${endtoendid}/devolucao/${txid}`,
        headers: {
            Authorization: `Bearer ${global.tokenefi}`,
            'Content-Type': 'application/json',
        },
        httpsAgent: agent,
        data: {
            valor: valor
        }
    };

    try {
        const response = await axios(config2);
       return response.data 
    } catch (error) {
        console.error('Erro ao reembolsar pagamento:', error.response ? error.response.data : error.message);
    }

    
}


module.exports = { ConfigEfíStart, UpdatePix, GenerateToken, SetCallBack, createCobEfi, generateQRCode, ReembolsoEfi }