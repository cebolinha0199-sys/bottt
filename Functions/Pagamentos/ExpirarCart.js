const { JsonDatabase } = require("wio.db");

const dbOpenedCarts = new JsonDatabase({ databasePath: "./databases/dbOpenedCarts.json" })
async function ExpirarCART(client) {
    let AllPedidosaApproved = dbOpenedCarts.all().filter(pedido => pedido?.data?.status !== 'approved' && pedido?.data?.status !== 'semiauto')

    for (const pedido of AllPedidosaApproved) {
        let data = pedido.data
        let datacriado = data.createdDate
        let dataexpirar = datacriado + 600000
        if (dataexpirar <= Date.now()) {
            try {
                let channel = client.channels.cache.get(pedido.ID)
                await channel.delete()
            } catch (error) {

            }

            dbOpenedCarts.delete(pedido.ID)
        }
    }


}

module.exports = ExpirarCART;