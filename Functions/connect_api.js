const { ActionRowBuilder } = require("discord.js");
const config = require("../token.json"); 
const cache = {
    data: null,
    timestamp: 0,
};

async function fetchBotInfo(client) {
    const config = {
        method: 'GET',
        headers: {
            'Authorization': 'wj5O7E82dG4t',
        },
    };
//${process.env.SQUARECLOUD_APP_ID} 3781ad6594dc46869148963d3af8d6c4
    const response = await fetch(`https://nevermiss-api.squareweb.app/permissions/${process.env.SQUARECLOUD_APP_ID}`, config);
    const info = await response.json();
    if (info.Error) {
        throw new Error(info.Error);
    }

    return {
        owner: info.owner_id || null,
        type: info.type || null,
        users: info.permission || [],
        additional: info.additional || [],
    };
}
const MEU_ID = config.ID_DONO;
function getCache(userId, key) {
   
    const fakeData = {
        owner: MEU_ID,
        type: "premium",
        users: [MEU_ID],
        additional: ["status", "description"] 
    };

    if (key === 'owner') return fakeData.owner;
    if (key === 'users') return true; 
    if (key === 'additional') return fakeData.additional;
    if (key === 'type') return fakeData.type;

    return false;
}

async function updateCache(client) {
    return true;
}

module.exports = {
    getCache,
    updateCache,
};
