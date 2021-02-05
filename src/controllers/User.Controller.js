const bcrypt = require('bcryptjs')
const config = require("../config/config.json");
const { getProfileUser } = require('../service/UserService');
const mobile_version = require("../config/mobile-version.json");
const helpers = require('../helpers');
const User = require('../db/models/User');
const Admin = require('../db/models/Admin');

class UserController {
  async getAllUser(req, res) {
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const search = req.query.search ? req.query.search : ''
    const order_by  = req.query.order_by ? req.query.order_by : 'asc'
    const sort_by   = req.query.sort_by ? req.query.sort_by : 'name' 
    let query = {}, user, totaluser, sortOrder = ''

    if (order_by == 'asc') {
      sortOrder = `${sort_by}`;
    } else if (order_by == 'desc') {
      sortOrder = `-${sort_by}`;
    } else {
      sortOrder = `name`;
    }

    try {
        query = { $and :[
          {$or: 
            [ 
              {name :{ $regex: search, $options: "i" }}
            ]
          }
          ]
        }

        const count = await User.countDocuments(query)
        
          user = await User.find(query)
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .sort(`${sortOrder}`)
          .exec()

    
      totaluser = user.length

      res.status(200).json({
        code : 200,
        message: 'Success Get List User',
        data: {
          user,
          totaluser,
          totalPages: Math.ceil(count / limit),
          totalAllUser : count,
          currentPage : page,
          limit
        },
      })
    } catch (error) {
      console.log(error)
      res.status(400).json({
        error,
      })
    }
  }

  async checkVersion(req, res) {
    try {
      res.status(200).json({
        code : 200,
        message: 'Success Check Version',
        data : mobile_version
      })
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Failed Check Version',
        error: true
      })
    }
  }

  async me(req, res) {
    const user = req.user;
    try {
      const data = await getProfileUser(user._id, 'noToken');
      const admin = await Admin.find().limit(1).select("phoneNumber");

        
      res.status(200).json({
        code: 200,
        message: "Success get profile",
        data : {...data, admin : admin[0].phoneNumber}
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'Failed get profile',
        error: true
      })
    }
  }

  async login(req, res) {
    let {
      email,
      password
    } = req.body;
    
    if (!email) {
      return res.status(400).json({
        code: 400,
        message: 'Email is required'        
      });
    }
    if (!password) {
      return res.status(400).json({
        code: 400,
        message: 'Password is required'        
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: 'Password Tidak Valid'        
      });
    }

    try {
      let checkAccount = await User.findOne({email : email })

      if(!checkAccount){
        return res.status(400).json({
          code: 400,
          message: 'Email yang anda masukan tidak terdaftar'
        });
      }

      const isPasswordMatch = await bcrypt.compare(password, checkAccount.password)
      
      if (!isPasswordMatch) {
        return res.status(400).json({
          code: 400,
          message: "Password yang anda masukan salah"
        })
      }
      const data = await getProfileUser(checkAccount._id, 'withToken');
      res.status(200).json({
        code: 200,
        message: 'Sukses Login User',
        data
      })
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: 'Gagal Login , Server sedang Sibuk',
        error
      })
    }
  }

  async register(req, res) {
    let {
      name, phoneNumber, email, dateOfBirth, password, fcmToken
    } = req.body;

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: 'Name is required'
      });
    }
    if (!phoneNumber) {
      return res.status(400).json({
        code: 400,
        message: 'Phone Number is required'
      });
    }    
    if (!email) {
      return res.status(400).json({
        code: 400,
        message: 'Email is required'
      });
    }
    if (!dateOfBirth) {
      return res.status(400).json({
        code: 400,
        message: 'Tanggal Lahir is required'
      });
    }    
    if (!password) {
      return res.status(400).json({
        code: 400,
        message: 'Password is required'
      });
    }    
    // Validation phoneNumber
    if (phoneNumber.length <= 9) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid phone number!'        
      });
    }

    phoneNumber = helpers.formatNumberDefaultIndo(phoneNumber);

    if (`${phoneNumber[0]}${phoneNumber[1]}` !== '62') {
      return res.status(400).json({
        code: 400,
        message: 'Nomor HP yang anda masukkan tidak valid di indonesia'
      });
    }

    const isEmail = helpers.validateEmail(email);    
    
    if(isEmail !== true){
      return res.status(400).json({
        code: 400,
        message: "Email is not valid"
      });
    }
  
    const emailUser = await User.findOne({ email } ).select('email');
    const phoneNumberUser = await User.findOne({ phoneNumber } ).select('phoneNumber');
      
    if (emailUser) {
      return res.status(400).json({
        code : 400,
        message: "Email Sudah Digunakan"
      });
    }      
    
    if (phoneNumberUser) {
      return res.status(400).json({
        code : 400, 
        message: "Phone Number Sudah Digunakan"
      });
    }

    if(password.length < 6){
      return res.status(400).json({
        code : 400, 
        message: "Password Tidak Boleh Kurang Dari 6 Huruf"
      });
    }
    const passwordHash = await bcrypt.hash(password, 6)

    const user = new User({
      name, 
      password : passwordHash,
      email, 
      phoneNumber,
      dateOfBirth,
      fcmToken
    });

    try {
      
      await user.save();
      const data = await getProfileUser(user._id, 'withToken');
           
      res.status(200).json({
        code: 200,
        message: "Success registered user",
        data
      });
  } catch (error) {
      res.status(500).json({
        code : 500,
        message: "Failed registered user",
        error
      });
  } 
  }

  async updateProfile(req, res) {
    let {
      name, phoneNumber, email, dateOfBirth, placeOfBirth, address, gender
    } = req.body;
    const myprofile = req.user;
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: 'Name is required'
      });
    }
    if (!phoneNumber) {
      return res.status(400).json({
        code: 400,
        message: 'Phone Number is required'
      });
    }    
    if (!email) {
      return res.status(400).json({
        code: 400,
        message: 'Email is required'
      });
    }
    if (!dateOfBirth) {
      return res.status(400).json({
        code: 400,
        message: 'Tanggal Lahir is required'
      });
    }    
    // Validation phoneNumber
    if (phoneNumber.length <= 9) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid phone number!'        
      });
    }

    phoneNumber = helpers.formatNumberDefaultIndo(phoneNumber);

    if (`${phoneNumber[0]}${phoneNumber[1]}` !== '62') {
      return res.status(400).json({
        code: 400,
        message: 'Nomor HP yang anda masukkan tidak valid di indonesia'
      });
    }

    const isEmail = helpers.validateEmail(email);    
    
    if(isEmail !== true){
      return res.status(400).json({
        code: 400,
        message: "Email is not valid"
      });
    }
  
    const emailUser = await User.findOne({ 
      $and: [
        {
          $or: [{
            email: email
          }]
        },
        {
          $or: [{
            email: { $ne: myprofile.email }
          }]
        }
      ]
      } ).select('email');

    const phoneNumberUser = await User.findOne({
        $and: [
          {
            $or: [{
              phoneNumber: phoneNumber
            }]
          },
          {
            $or: [{
              phoneNumber: { $ne: myprofile.phoneNumber }
            }]
          }
        ]
      }
     ).select('phoneNumber');
      
    if (emailUser) {
      return res.status(400).json({
        code : 400,
        message: "Email Sudah Digunakan"
      });
    }      
    
    if (phoneNumberUser) {
      return res.status(400).json({
        code : 400, 
        message: "Phone Number Sudah Digunakan"
      });
    }

    try {
      
      const user = await User.updateOne({_id : myprofile._id},
      {
        $set :{
          name, 
          email, 
          phoneNumber,
          dateOfBirth,
          placeOfBirth,
          gender,
          address
        }
      });  
     
      const data = await getProfileUser(myprofile._id, 'noToken');
           
      res.status(200).json({
        code: 200,
        message: "Success updated user",
        data
      });
  } catch (error) {
      res.status(500).json({
        code : 500,
        message: "Failed update user",
        error
      });
  } 
  }

  async updatePassword(req, res) {
    let {
      password, oldPassword
    } = req.body;
    const myprofile = req.user;
    
    if (!password) {
      return res.status(400).json({
        code: 400,
        message: 'Password is required'
      });
    }

    if (!oldPassword) {
      return res.status(400).json({
        code: 400,
        message: 'Old Password is required'
      });
    }    

    if(password.length < 6){
      return res.status(400).json({
        code : 400, 
        message: "Password Tidak Boleh Kurang Dari 6 Huruf"
      });
    }
    
    try {
      const isPasswordMatch = await bcrypt.compare(oldPassword, myprofile.password)
      
      if (!isPasswordMatch) {
        return res.status(400).json({
          code: 400,
          message: "Password Lama yang anda masukan salah"
        })
      }  
      const passwordHash = await bcrypt.hash(password, 6)

      const user = await User.updateOne({_id : myprofile._id},
      {
        $set :{
          password : passwordHash
        }
      });  
     
      const data = await getProfileUser(myprofile._id, 'noToken');
           
      res.status(200).json({
        code: 200,
        message: "Success Change Password",
        data
      });
  } catch (error) {
      res.status(500).json({
        code : 500,
        message: "Failed Change Password",
        error
      });
  } 
}
  
async uploadPhoto(req, res) { 
  const myprofile = req.user;
  try {
      const file = req.file;
      if (!file) {
        res.status(400).send({
          status: false,
          data: "No File is selected.",
        });
      }
      let result = `${file.path}`;
      const user = await User.updateOne({_id : myprofile._id},
        {
          $set :{
            photoProfile : result
          }
        });  
       
        const data = await getProfileUser(myprofile._id, 'noToken');
             
      console.log(file);
      return res.status(200).json({
          code : 200,
          message: 'Success Uploading Images Profile',
          data 
      });
      
  }
    catch(error){
      console.log('error')
      console.log(error)
      res.status(500).json({
        code : 500,
        message: 'Server sedang Sibuk'
      })
  }
  }
  async deleteUser(req, res) {
    try {
      await User.deleteOne({ _id: req.params.id})
      res.status(200).json({
        code : 200,
        message: 'Success delete user',
        data: {
          user : req.params.id,
        },
      })
    } catch (error) {
      res.status(400).json({
        error,
      })
    }
  }

  async resetPassword(req, res) {
    try {
      let password = "123456";
      const passwordHash = await bcrypt.hash(password, 6)

      const user = await User.updateOne({_id : req.params.id},
      {
        $set :{
          password : passwordHash
        }
      });  
      const data = await getProfileUser(req.params.id, 'noToken');
      res.status(200).json({
        code : 200,
        message: 'Success Mereset Password Menjadi ' + password,
        data
      })
    } catch (error) {
      res.status(400).json({
        error,
      })
    }
  }

  async getDetailuser(req, res) {
    try {
      const data = await getProfileUser(req.params.id, 'noToken');
      res.status(200).json({
        code : 200,
        message: 'Success Get Detail User',
        data
      })
    } catch (error) {
      res.status(400).json({
        error,
      })
    }
  }
}
module.exports = new UserController;