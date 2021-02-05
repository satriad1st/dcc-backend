const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require("path");

cloudinary.config({
  cloud_name: 'sdanalyzer',
  api_key: '619489893611425',
  api_secret: 'TBkiFFzHSbRVaT6WlEtgxr2BQLY'
});

const diskStorage = new CloudinaryStorage({
  cloudinary,
  folder: 'assets/product', 
  allowedFormats: ['jpg', 'png', 'jpeg', 'gid', 'pdf'],
  filename: function (req, file, cb) {
    console.log(req)
    console.log(file)
    cb(null, file.originalname);
  }
});

  
module.exports = {
   diskStorage
}