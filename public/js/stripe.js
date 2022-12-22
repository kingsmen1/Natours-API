/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51M9nnrSIH2aTZA92VigBxG04qGjmY9mETYcYcmF96MxXNo8PJyqiC3VK6zxS9DQuLuv50bvCX47fedrfRPPfSOEB00UlBeWiuT'
);

export const bookTour = async (tourId) => {
  try {
    //1) Get Checkout sessoin from api.
    //^ Without parameter's axios is set default to 'get'
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);

    //2) Create Checkout form + Charge Credit Card.
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
