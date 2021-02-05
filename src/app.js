const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const adminRouter = require("./routers/admin");
const userRouter = require("./routers/user");

require('./db/mongo');


const app = express();
const port = process.env.PORT || 5000;

app.set('etag', false);

app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(compression());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.static('src/public'));

// Routes
app.get('/', (_, res) => {
  return res.status(200).json({
    message: "Welcome to Backend API DCC Komputer"
  });
});

// Routes prefix
app.use('/admin', adminRouter);
app.use('/user',userRouter);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;