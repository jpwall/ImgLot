var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var baseDir = '/home/jpwall/Git/ImgLot/data/';

/* GET ImgLot main page */
router.get('/', function(req, res, next) {
  res.render('index');
});

/* POST image submission */
router.post('/upload', function(req, res, next) {
    if (!req.files || Object.keys(req.files).length === 0) {
	return res.status(400).send('No files were uploaded.');
    }
    // md5: req.files.userImage.md5
    // filename: req.files.userImage.name
    // type: req.files.userImage.mimetype
    //console.log(req);

    // IF db does not contain md5, go below AND add new row to DB. Otherwise, report conflict
    let imgUpload = req.files.userImage;
    imgUpload.mv(baseDir + req.files.userImage.md5 + "."
		 + req.files.userImage.mimetype.split("/").pop(),
		 function(err) {
		     if (err) {
			 return res.status(500).send(err);
			 // ^ Error uploading, please try again!
		     }
		     // Get random row from DB and res.sendFile corresponding MD5
    });
});

module.exports = router;
