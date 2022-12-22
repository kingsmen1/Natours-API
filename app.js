const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewsRouter = require('./routes/reviewsRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const { webhookCheckout } = require('./controllers/tourControllers');

const app = express();

app.enable('trust proxy');

//Setting up PUG Template Engine.
app.set('view engine', 'pug');
//path module automatically assing path to given rootDirectory.
//So we dont have to manually declare it by "../../"
app.set('views', path.join(__dirname, 'views'));

//*Setting cors (used to enable cross-origin resource sharing)
app.use(cors());

app.options('*', cors());

// 1)GLOBAL MIDDLEWARES .

//*For serving static file to user ex -html , pics ,css.
app.use(express.static(path.join(__dirname, 'public')));

//*Set security HTTP headers.
//^ we are not calling helmet function it just returns a middleware .
app.use(helmet());
const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://cdnjs.cloudflare.com/',
  'https://*.stripe.com/',
  'https://js.stripe.com/',
];
const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://a.tiles.mapbox.com/',
  'https://b.tiles.mapbox.com/',
  'https://events.mapbox.com/',
  'https://bundle.js:*',
  'ws://127.0.0.1:*/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      // defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      frameSrc: ["'self'", 'https://*.stripe.com'],
      // objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

//*Development loging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//*rate limiting : limit the number of requests per IP.
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again in an hour!',
});

app.use('/api', limiter);

//^ Must implement this stripe route before express.json middleware as it need's raw data.
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);

//*Body parser , reading data from body into req.body .
app.use(express.json({ limit: '10kb' }));
//*Url Encoding parser
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
//*Cookie parser used to access cookies from browser/client.
app.use(cookieParser());

//*Data sanitization against NoSQL query injection.
//It looks at the request body, the request query string, and also at Request.Params,
// and then it will basically filter out all of the dollar signs and dots
app.use(mongoSanitize());

//*Data sanitization against XSS(CROSS SITE SCRIPTING).
/*This will then clean any user input from malicious HTML code, basically.
Imagine that an attacker would try to insert some malicious HTML code with some
JavaScript code attached to it.If that would then later be injected into our HTML site,
it could really create some damage then.
Using this middleware, we prevent that basically by converting all these HTML symbols.*/
app.use(xss());

//*Prevent parameter polution.
//It filter's duplicate query parameters ex: /tours?duration=5&duration=9
//whitelist is the list of allowed query parameters.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//*Creating middleware. These runs only on request.
//always use Global middleware's before route handlers .
//*Test middleware
app.use((req, res, next) => {
  // console.log(`cookies -----${req.cookies}`);
  //without next() the Request-Response cycle will be stuck.
  next();
});

app.use((req, res, next) => {
  //adding time property to req object .
  req.requestTime = new Date().toISOString();
  next();
});

//*Mounting the Router(mounting new router on a route).

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingRouter);

//*Handeling All un-handled routes
//all is for all api methods. ex "get",
//'*' trigger's all URL'S so always place this after all router's.
app.all('*', (req, res, next) => {
  //Error() creates a new error.
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = '404';
  //^req.originalUrl is User's original URL.
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

//exporting all app configuration .
module.exports = app;
