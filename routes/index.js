var express = require('express');
var crypto = require('crypto');
var { Pool, Client } = require('pg')
var router = express.Router();
var baseDir = '/home/jpwall/Git/ImgLot/images/';

var imglot = new Pool({
  user: 'imglot',
  host: 'localhost',
  database: 'imglot',
  password: 'password',
    port: 5432
})

/* GET ImgLot main page */
router.get('/', function(req, res, next) {
  res.render('index');
});

/* POST image submission */
router.post('/upload', function(expressReq, expressRes, next) {
    if (!expressReq.files || Object.keys(expressReq.files).length === 0) {
	return expressRes.status(400).send('No files were uploaded.');
    }

    var submitMD5 = expressReq.files.userImage.md5;
    var submitFileType = expressReq.files.userImage.mimetype.split("/").pop();
    if (submitFileType == 'jpg' || submitFileType == 'jpeg' || submitFileType == 'png'
	|| submitFileType == 'bmp' || submitFiletype == 'tiff' || submitFileType == 'gif') {
	var containsQuery = 'SELECT exists (SELECT 1 FROM images WHERE md5 = \'' + submitMD5 + '\' LIMIT 1)';
	imglot.query(containsQuery, (containsErr, containsRes) => {
	    if (containsErr) {
		console.log(containsErr.stack)
	    } else {
		if (!containsRes.rows[0].exists) {		
		    var imgUpload = expressReq.files.userImage;
		    imgUpload.mv(baseDir + submitMD5 + "." + submitFileType,
				 function(expressErr) {
				     if (expressErr) {
					 return expressRes.status(500).send("Error uploading! Try again.");
				     }

				     var nsfwImage = false;
				     if (expressReq.body.imgNsfw != undefined && expressReq.body.imgNsfw == "on") {
					 nsfwImage = true;
				     }
				     
				     var insertQuery = 'INSERT INTO images (md5, nsfw, filetype) VALUES (\''
					 + submitMD5 + '\', ' + nsfwImage + ', \'' + submitFileType + '\')';
				     imglot.query(insertQuery, (insertErr, insertRes) => {
					 if (insertErr) {
					     console.log(insertErr.stack);
					 } else {
					     var findQuery = '';
					     if (expressReq.body.noNsfwResult != undefined &&
						 expressReq.body.noNsfwResult == "on") {
						 findQuery = 'SELECT * FROM images WHERE nsfw = false ORDER BY RANDOM() LIMIT 1';
					     } else {
						 findQuery = 'SELECT * FROM images ORDER BY RANDOM() LIMIT 1';
					     }

					     imglot.query(findQuery, (findErr, findRes) => {
						 if (findErr) {
						     console.log(findErr.stack)
						 } else {
						     expressRes.sendFile(baseDir + findRes.rows[0].md5 + '.'
									 + findRes.rows[0].filetype);
						 }
					     })
					 }
				     })
				 });
		} else {
		    //expressRes.status(200).send("There is a duplicate of your submitted image on the server! Please try again.");
		    expressRes.sendFile(baseDir + "error.png");
		}
	    }
	})
    } else {
	res.status(400).send("Please submit a file of the correct format - jpg, jpeg, png, bmp, tiff, or gif!");
    }
});

module.exports = router;
