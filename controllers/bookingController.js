const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
// const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
// const AppError = require('../utils/appError');

exports.getCheckOutSession = catchAsync(async (req, res, next) => {
  // console.log(req.params.tourId);
  //1)Get currently booked tour.
  const tour = await Tour.findById(req.params.tourId);

  //2)Create CheckoutSession .
  //Information about the session.
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    expand: ['line_items'],
    mode: 'payment',
    //if Checkout Successfull will 'get' to this url.
    //passing data through query String.
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    //Information about the product user is about to purchase.
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          product_data: {
            // amount: tour.price * 100,
            name: `${tour.name} Tour`,
            // metadata: {
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
            // },
          },
          unit_amount: tour.price * 100, //Product price * Converting it to cents.
        },
      },
    ],
  });
  // line_items: [
  //   {
  //     quantity: 1,
  //     price_data: {
  //       currency: 'usd',
  //       unit_amount: tour.price * 100, //Converting it to cents.
  //       product_data: {
  //         name: `${tour.name} Tour`,
  //         description: tour.summary,
  //         images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
  //       },
  //     },
  //   },
  // ],
  //   });

  //3) Create Session as response.
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //^This is temporary , because eveyone can make booking without paying.
//   const { tour, user, price } = req.query;
//   console.log(tour, user, price);
//   if (!tour || !user || !price) return next(); //If any not present passing to next Overview page.
//   await Booking.create({
//     tour,
//     user,
//     price,
//   });
//   //*'redirect' here does is basically to create a new request
//   res.redirect(req.originalUrl.split('?')[0]);
//   //spliting it requesting original url removing queryString for safety / better practice.
//   //originalUrl = `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}$user=${req.user.id}$price=${tour.price}`,
// });

// const createBookingCheckout = async (session) => {
//   const tour = session.client_reference_id;
//   const user = (await User.findOne({ email: session.customer_email })).id;
//   const price = session.line_items[0].price_data.unit_amount / 100;
//   console.log(price);
//   User.Booking.create({
//     tour,
//     user,
//     price,
//   });
// };

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  console.log(signature);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error :${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    // createBookingCheckout(event.data.object);
    const { email } = event.data.object.customer_details;
    const { client_reference_id: refId } = event.data.object;
    const { amount_total: amount } = event.data.object;
    res.status(200).json({ received: true, email, refId, amount });
  }
};

//~~~~~~~~~~~ api ~~~~~~~~//
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.delteBooking = factory.deleteOne(Booking);
