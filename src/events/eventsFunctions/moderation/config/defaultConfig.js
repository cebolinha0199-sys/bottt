const defaultConfig = {
    antiRaid: {
        enabled: false,
        channelProtection: {
            enabled: false,
            action: 'removePermissions'
        },
        roleProtection: {
            enabled: false,
            action: 'removePermissions'
        },
        banProtection: {
            enabled: false,
            action: 'ban',
            threshold: 5
        },
        kickProtection: {
            enabled: false,
            action: 'removePermissions',
            threshold: 5
        }
    },
    autoMod: {
        enabled: false,
        spamDetection: {
            enabled: false,
            messageThreshold: 5,
            timeThreshold: 5,
            action: 'timeout',
            duration: 10
        },
        linkFilter: {
            enabled: false,
            whitelistedDomains: [],
            action: 'delete'
        },
        mentionFilter: {
            enabled: false,
            threshold: 5,
            action: 'timeout',
            duration: 10
        }
    },
    logs: {
        enabled: false,
        securityChannel: null,
        moderationChannel: null,
        serverChannel: null,
        logOptions: {
            bans: true,
            kicks: true,
            timeouts: true,
            channelChanges: true,
            roleChanges: true,
            messageDeletes: true,
            joins: true,
            leaves: true
        }
    },
    altDetection: {
        enabled: false,
        minAccountAge: 7, // dias
        action: 'verify',
        verificationChannel: null,
        verificationMessage: 'Sua conta é muito recente. Por favor, complete a verificação para acessar o servidor.'
    }
};

module.exports = { defaultConfig };