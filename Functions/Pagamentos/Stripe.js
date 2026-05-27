async function createPaymentLinkWithSecretKey(secretKey, preco, name) {
    try {


        // mude de real para centavos
        preco = preco * 100;

        const stripe = require('stripe')(secretKey);  // Passando a chave secret_key dinamicamente

        // Criação do produto
        const product = await stripe.products.create({ name: name });

        // Criação do preço
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: preco,
            currency: global.lenguage.stripe,
        });

        const paymentLink = await stripe.paymentLinks.create({
            line_items: [{ price: price.id, quantity: 1 }],
        });

        return {
            url: paymentLink.url,
            id: paymentLink.id,
        }
    } catch (error) {
        console.log(error)
        return {
            error: true,
            message: error.message,
            status: 500,
        }
    }
}

module.exports = {
    createPaymentLinkWithSecretKey
}