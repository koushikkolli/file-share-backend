const cors = require("cors")
const express = require("express");
const dotenv = require("dotenv")
const nodemailer = require("nodemailer")
const multer = require('multer');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3')
const _ = require("lodash")


const app = express();
let port = process.env.PORT || 3001;
app.listen(port, ()=>console.log(`The app is running on port: ${port}`));
app.use(express.json());
app.use(cors())
dotenv.config()

const url = process.env.DB_URL || 'mongodb://localhost:27017';

console.log(process.env.mail)
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
         user: "koushik8.kolli@gmail.com",
         pass: "9740koushik"
     }
 });
            

 const mailOptions = {
  from: "koushik8.kolli@gmail.com", // sender address
  to: '', // list of receivers
  subject: 'File Share', // Subject line
  html: ''// plain text body
};

const s3Region = "us-east-1"
const s3Bucket = 'fileuploadshare'
const s3Config = {
  accessKeyId: "AKIASLQVUVHDD5QFV7G3",
  secretAccessKey: "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"
};
AWS.config.update(s3Config);

AWS.config.region = s3Region ;

const s3 = new AWS.S3();

const upload = multer({
       storage: multerS3({
           s3: s3,
           bucket: s3Bucket,
           metadata: function (req, file, cb) {
               cb(null, {fieldName: file.fieldname});
           },
           key: function (req, file, cb) {
               const filename = `${file.originalname}`;
               cb(null, filename)
           }
       })
})


app.post("/upload", upload.single('image'),async (req, res) => {
    try {
      const options  ={
        Bucket: s3Bucket,
        Key: req.body.name,
        Expires: 3600, // one hour expires.
      };
      const url = s3.getSignedUrl('getObject', options);
      const to = req.body.email
      const from = req.body.from
      mailOptions.to = to//req.body.email
      mailOptions.html = `<p>Hi,</p><p>${from} has sent to you file. Click <a href="${url}">here</a> to download. URL expires in one hour`
      await transporter.sendMail(mailOptions)
     res.status(200).json({
        message: "Activation mail sent",
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: "Internal Server Error"
      });
    }
  });