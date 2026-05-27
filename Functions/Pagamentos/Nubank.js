

const Imap = require('imap');
const { JsonDatabase } = require('wio.db');
const dbb = new JsonDatabase({ databasePath: "./databases/PagamentosNu.json" });

let checkInterval = null;

function startPeriodicCheck(imap, type) {
    if (checkInterval) {
        clearInterval(checkInterval);
    }

    performCheck(imap, type);

    checkInterval = setInterval(() => {
        performCheck(imap, type);
    }, 20000);
}

function performCheck(imap, type) {
    if (!imap || imap.state !== 'authenticated') {
        console.log('❌ IMAP não está conectado. Pulando verificação.');
        return;
    }

    const emailname = type === 'nubank' ? 'todomundo@nubank.com.br' : 'no-reply@picpay.com';


    imap.search([['FROM', emailname]], function (err, results) {
        if (err) {
            console.error('Erro ao buscar e-mails:', err);
            return;
        }

        if (results.length === 0) {
            return;
        }

        const lastemailsave =  dbb.fetchAll();
        const lastemail = lastemailsave.map((value) => value.ID);
        const lastemailmax = Math.max(...lastemail, 0);

        const lastMessages = results.slice(-5).filter(seqno => seqno > lastemailmax);

        lastMessages.forEach(seqno => {
            processEmail(imap, seqno, type);
        });
    });
}

function processEmail(imap, seqno, type) {
    const fetch = imap.fetch(seqno, { bodies: ['TEXT'] });

    fetch.on('message', function (msg) {
        let processed = false;

        msg.on('body', function (stream) {
            let buffer = '';

            stream.on('data', chunk => buffer += chunk.toString());

            stream.on('end', function () {
                if (processed) return;
                processed = true;

                const body = buffer.trim()
                    .replace(/--.*?boundary.*?--/gs, '')
                    .replace(/<[^>]*>/g, '')
                    .replace(/=\r?\n/g, '')
                    .trim();

                const patterns = {
                    picpay: {
                        name: /de\s+([A-Za-zá-úÁ-Ú\s]+(?:[A-Za-zá-úÁ-Ú]+\s[A-Za-zá-úÁ-Ú]+)?)(?=\s+Valor)/,
                        value: /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/
                    },
                    nubank: {
                        name: /de\s+([A-Za-z\s]+(?:[A-Za-z]+\s[A-Za-z]+)?)(?=\s+e\s+o\s+valor)/,
                        value: /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/
                    }
                };

                if (body.includes(`Deu tudo certo com a sua transfer`)) {
                    return;
                }

                const pattern = patterns[type];
                const nameMatch = body.match(pattern.name);
                const valueMatch = body.match(pattern.value);


                const name = nameMatch ? nameMatch[1].trim() : 'Nome não encontrado';
                const value = valueMatch ? valueMatch[1].trim().replace(',', '.') : 'Valor não encontrado';

                if (value !== 'Valor não encontrado') {

                    if (!dbb.get(String(seqno))) {
                        dbb.set(String(seqno), {
                            nome: name,
                            valor: value,
                            data: Date.now(),
                            used: false,
                            type: type
                        });
                        console.log(`✅ Novo e-mail processado: ${name} - R$ ${value}`);
                    }
                }
            });
        });
    });
}

function connectIMAP(type, imapConfig, isInitialConnection = true) {
    return new Promise((resolve, reject) => {
        let imap = new Imap(imapConfig);
        currentImap = imap;

        const restartConnection = (newConfig) => {
            console.log('🔄 Reconectando com novas configurações...');

            if (imap.state !== 'disconnected') {
                imap.once('end', () => {
                    console.log('🔌 Conexão encerrada. Iniciando nova conexão...');
                    imap = new Imap(newConfig);
                    currentImap = imap;
                    setupIMAPEvents(imap, type);
                    imap.connect();
                });
                imap.end();
            } else {
                imap = new Imap(newConfig);
                currentImap = imap;
                setupIMAPEvents(imap, type);
                imap.connect();
            }
        };

        function setupIMAPEvents(imap, type) {
            imap.once('ready', function () {
                openInbox(imap, function (err, box) {
                    if (err) {
                        reject('Erro ao abrir a caixa de entrada: ' + err);
                        return;
                    }
                    console.log('📂 Caixa de entrada aberta!');
                    resolve({ code: 'OK', message: 'Caixa de entrada aberta!' });
                    startPeriodicCheck(imap, type);
                    global.statusImap = true;
                });
            });

            imap.once('error', function (err) {
                global.statusImap = false;

                if (!err?.textCode || err.textCode !== 'AUTHENTICATIONFAILED') {
                    console.log('🔁 Tentando reconectar após erro...');
                    attemptReconnect(imapConfig);
                }
            });

            imap.once('end', function () {
                console.log('Conexão IMAP encerrada.');
                global.statusImap = false;

                if (!isInitialConnection) {
                    attemptReconnect(imapConfig);
                }
            });
        }

        function attemptReconnect(config, delay = 20000) {
            setTimeout(() => {
                connectIMAP(type, config, false)
                    .then((res) => console.log('✅ Reconectado com sucesso!'))
                    .catch((err) => {
                        console.error('[ERRO de reconexão]', err);
                        attemptReconnect(config, delay);
                    });
            }, delay);
        }

        function openInbox(imap, cb) {
            imap.openBox('INBOX', true, cb);
        }

        if (global.statusImap) {
            restartConnection(imapConfig);
        } else {
            setupIMAPEvents(imap, type);
            imap.connect();
        }
    });
}

// Função para parar a verificação periódica
function stopPeriodicCheck() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        console.log('🛑 Verificação periódica interrompida');
    }
}

function disconnectIMAP() {
    stopPeriodicCheck();
    if (currentImap && currentImap.state !== 'disconnected') {
        console.log('⛔ Encerrando conexão IMAP manualmente...');
        currentImap.end();
        global.statusImap = false;
    }
}

module.exports = {
    connectIMAP,
    disconnectIMAP,
    startPeriodicCheck,
    stopPeriodicCheck
};