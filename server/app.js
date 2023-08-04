let express = require("express");
let path = require('path');
let logger = require('morgan');
var cors = require('cors')
const bodyParser = require('body-parser');

var apiRouter = require('./routes/api');
let PORT = 3001;

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', apiRouter, cors());

app.listen(PORT);
console.log(`listening on ${PORT}`);

module.exports = app;