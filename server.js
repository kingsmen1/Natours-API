const mongoose = require('mongoose');
const dotenv = require('dotenv');

//*handeling unhandledException in smilar way.
//^NOTE: it should be alway be top of our code.
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception 💥SHUTTING DOWN ');
  console.log(err.name, err.message);
  process.exit(1); //1 stands for unhandled rejection , 0 for success.
});

dotenv.config({ path: './config.env' }); //Setting envoironment variable.
const app = require('./app'); //importing all the app settings from the app.js
// console.log(app.get('env')); //getting current working environment from express.
// console.log(process.env.NODE_ENV); //all environment variables from node.

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
//*connecting  mongodb database with mongoose .2nd args is just for deprication warnings.
mongoose
  .connect(DB, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('DB connection successful');
    const port = process.env.PORT || 4500;
    const server = app.listen(port, () => {
      console.log(`App listening on ${port}`);
    });
    //*handeling unhandledRejection by subscribing to unhandledRejection event.
    process.on('unhandledRejection', (err) => {
      console.log(err.name, err.message);
      console.log('UNHANDLED REJECTION 💥SHUTTING DOWN ');
      server.close(() => {
        process.exit(1); //1 stands for unhandled rejection , 0 for success.
      });
    });
  })
  .catch((error) => console.log(error));
