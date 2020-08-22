const path = require('path');
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const db = require('./config/keys').MONGO_URI;
const Url = require('./models/Url');

const app = express();

mongoose
    .connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error(err);
    });

var randomString = () => {
    var num = uuidv4();
    var newNum = num.replace(/-/g, '');
    return shortenedString = newNum.substr(0, 16)
};

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

app.post('/process', (req, res) => {
    // Initialize original url
    let originalUrl;
    
    try {
      originalUrl = new URL(req.body.url);

    } catch (err) {
        return res.status(400).send({error: "Invalid URL input, try again"});
    }
    
    dns.lookup(originalUrl.hostname, err => {
        if(err){
            return res.status(400).send({error: "Address not found"});
        }

        let shortUrl = randomString();

        Url.findOneAndUpdate({ original_url: originalUrl },{
            $setOnInsert: {
                original_url: originalUrl,
                short_url: shortUrl
            }
        }, {
            returnOriginal: false,
            upsert: true
        }, (err, data) => {
            if(err){
                console.error(err)
            }else{
                res.json({
                    oldurl: originalUrl,
                    newurl: shortUrl
                })
            }
        });
    });

    // console.log(url);
    // res.json({ "oldurl": url, "newurl": shortened });
});

app.get('/:shorturl', (req, res) => {
    let newurl = req.params.shorturl;

    Url.find({short_url: newurl})
        .then(data => {
            res.redirect(data[0].original_url);
        })
        .catch(err => {
            console.error(err);
        });
});

PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on Port: ${PORT}`));