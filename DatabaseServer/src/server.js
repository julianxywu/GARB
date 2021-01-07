import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import mongoose from 'mongoose';
import apiRouter from './router';

// initialize
const app = express();

// const allowCrossDomain = function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

//   // intercept OPTIONS method
//   if (req.method === 'OPTIONS') {
//     res.send(200);
//   } else {
//     next();
//   }
// };
// enable/disable cross origin resource sharing if necessary
app.use(cors());
// app.use(allowCrossDomain);

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// REGISTER OUR ROUTES -------------------------------
// all of our routes will not be prefixed with anything
// this should go AFTER body parser
app.use('', apiRouter);

// additional init stuff should go before hitting the routing
// DB Setup
// const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/blog';
//const mongoURI = 'mongodb+srv://garb_dbuser:vusW7BJbchkMZ@cluster0.o53iy.mongodb.net/garbdb?retryWrites=true&w=majority' || 'mongodb://localhost/blog';
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/blog';
mongoose.connect(mongoURI, { useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true });
// set mongoose promises to es6 default
mongoose.Promise = global.Promise;

// default index route
app.get('/', (req, res) => {
  res.send('hi');
});

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);

console.log(`listening on: ${port}`);
