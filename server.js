const express = require('express');
const stripe = require('stripe')('sk_test_51JprSpH6YrdtkYECuPCY9zC2NFGRYuEBZLes9paj0cRrjSoMTAi1nX3lBYgzsaH7kxeT8KAFZUE3EG18CdJPE4Xq00gC0QbE7Y');
const cors = require('cors');
const app = express();

app.use(cors()); // Enable CORS
app.use(express.static('public'));
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: req.body,
        mode: 'payment',
        billing_address_collection: 'required', // Collect billing address
        shipping_address_collection: {
            allowed_countries: ['ES', 'FR', 'IT', 'AD'] // Add the countries you want to allow
        },
        success_url: `${req.headers.origin}/success`,
        cancel_url: `${req.headers.origin}/cancel`,
    });

    res.json({ id: session.id });
});

app.listen(3000, () => console.log('Server running on port 3000 chong'));