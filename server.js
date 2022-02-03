require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const validUrl = require('valid-url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

app.use('/public', express.static(`${process.cwd()}/public`));
// connection to MONGODB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// verifying connection to DB
const connection = mongoose.connection;
connection.on('error', (err) => console.error(`error: ${err}`))
connection.once('open', () => {
  console.log("Connected to MONGO DB")
})
// creating schema for my DB
const Schema = mongoose.Schema;
// creating Schema MODEL
const urlSchema = new Schema({
  original_url: String,
  short_url: String,
})

// registering MODEL
const URL = mongoose.model("URL", urlSchema)

// capturing user input url and POST(ing) it to DB
app.post("/api/shorturl", async function (req, res) {
  const longUrl = req.body.url
  // console.log(longUrl);
  const shortUrl = shortid.generate()
  // checking if the url is a valid url
  if (!validUrl.isWebUri(longUrl)) {
    res.status(401).json({ error: 'invalid URL' })
  }
  else {
    try {
      // checking if longurl is already in DB
      let findOne = await URL.findOne(({
        original_url: longUrl,
      }))
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        findOne = new URL({
          original_url: longUrl,
          short_url: shortUrl
        })
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Server Error')
    }
  }
})
app.get('/api/shorturl/:short_url?', async function (req, res) {
  try {
    const urlParam = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParam) {
      return res.redirect(urlParam.original_url)
    } else {
      return res.status(404).json("No URL found")
    }
  }
  catch (err) {
    console.log(err)
    res.status(500).json("Server error")
  }
})

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
