const Admin = require("../db/models/Admin");
const helpers = require('../helpers');
const bcrypt = require('bcryptjs')

class AdminController {

  async login(req, res) {
    const {
      email,
      password
    } = req.body;

    let admin;

    if (!email) {
      return res.status(400).json({
        code : 400,
        message: 'Email Wajib Diisi'
      });
    }
    if (!password) {
      return res.status(400).json({
        code : 400,
        message: 'Password Dibutuhkan'
      });
    }

    const isEmail = helpers.validateEmail(email);

    try {
      if (isEmail) {
        // search by email
        admin = await Admin.findByCredentials(email, password);
        
        if(admin==401){
            return res.status(400).json({
                code : 400,
                message: "Email Tidak Ditemukan"
            });
        }else if(admin==400){
            return res.status(400).json({
                code : 400,
                message: "Password Yang Anda Masukan Salah"
            });
        }
      }else{
        return res.status(400).json({
            code : 400,
            message: "Format Email Salah"
          });
      }

      if (!admin) {
        return res.status(400).json({
          code : 400,
          message: "Admin tidak ada"
        });
      }
      
      let token = await findAdminByemail(email,'withToken')
      res.status(200).json({
        code : 200,
        message: 'Berhasil Login',
        data : token
      })
    } catch (error) {
      console.log('error')
      console.log(error)
      res.status(500).json({
        code : 500,
        message: 'Server sedang Sibuk'
      })
    }  
  }
  //Akhir Login
  
  //Awal Logout
  async logout(req, res) {
    try {
      req.admin.tokens = req.admin.tokens.filter((token) => {
        return token.token != req.token
      })
      await req.admin.save()
      res.send()
    } catch (error) {
      res.status(500).json({  
        error,
      })
    }
  }
  //Akhir Logout
  //Awal Get Admin
  async getAllAdmin(req, res) {
    const page = req.query.page ? req.query.page : 1
    const limit = req.query.limit ? req.query.limit : 10
    const search = req.query.search ? req.query.search : null
    const order_by  = req.query.order_by ? req.query.order_by : 'asc'
    const sort_by   = req.query.sort_by == 'created_at' ? 'createdAt' : req.query.sort_by
    let query = {}, admin, totalAdmin, sortOrder = ''

    if (order_by == 'asc') {
      sortOrder = `${sort_by}`;
    } else if (order_by == 'desc') {
      sortOrder = `-${sort_by}`;
    } else {
      sortOrder = `-createdAt`;
    }

    try {
      const count = await Admin.countDocuments()
      if (search !== null) {
        query = { 
          $or: 
            [ 
              {fullName :{ $regex: search, $options: "i" }},
              {email :{ $regex: search, $options: "i" }},
              {phoneNumber :{ $regex: search, $options: "i" }}
            ]
        }
        
        admin = await Admin.find(query)
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .sort(`${sortOrder}`)
          .exec()

        if (totalAdmin === 0) {
          return res.status(400).json({
            message: "Data Not Found"
          });
        }
      } else {
        admin = await Admin.find()
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort(`${sortOrder}`)
        .exec()
      }
      
      totalAdmin = admin.length

      res.status(200).json({
        message: 'Success Get Admin',
        data: {
          admin,
          totalAdmin,
          totalPages: Math.ceil(count / limit),
        },
      })
    } catch (error) {
      res.status(400).json({
        error,
      })
    }
  }
  //Akhir Get Admin
  //Awal Create Admin
  async create(req, res) {
      
    let roleAdmin = req.admin.role;
    if (roleAdmin!="superadmin") {
        return res.status(400).json({
          code : 400,
          message: 'Anda Tidak Memiliki Hak Untuk Menambahkan Admin'
        });
    }
    const {
      fullName,
      email,
      phoneNumber,
      password,
      role
    } = req.body;

    if (!fullName) {
      return res.status(400).json({
        code : 400,
        message: 'Nama Dibutuhkan'
      });
    }
    if (!phoneNumber) {
      return res.status(400).json({
        code : 400,
        message: 'Phone Number Dibutuhkan'
      });
    }    
    if (!email) {
      return res.status(400).json({
        code : 400,
        message: 'Email Dibutuhkan'
      });
    }
    if (!password) {
      return res.status(400).json({
        code : 400,
        message: 'Password Dibutuhkan'
      });
    }    
    if (!role) {
      return res.status(400).json({
        code : 400,
        message: 'Role Admin Dibutuhkan'
      });
    }

    if (phoneNumber.length <= 10) {
      return res.status(400).json({
        code : 400,
        message: 'Nomor HP yang anda masukkan tidak valid'        
      });
    }

    const isEmail = helpers.validateEmail(email);    
      
    if(isEmail !== true){
      return res.status(400).json({
        code : 400,
        message: "Email is not valid"
      });
    }

    const emailAdmin = await Admin.findOne({ email } );
    const phoneNumberAdmin = await Admin.findOne({ phoneNumber } );
      
    if (emailAdmin) {
      return res.status(400).json({
        code : 400,
        message: "Email is registered"
      });
    }      
    
    if (phoneNumberAdmin) {
      return res.status(400).json({
        code : 400,
        message: "Phone Number is registered"
      });
    }
    
    const newAdmin = new Admin({
      fullName,
      email,
      phoneNumber,
      password,
      oldPassword : password,
      role
    })

    try {
      await newAdmin.save()
      
      const admin = await getProfileAdminById(newAdmin._id, 'withToken');

      res.status(200).json({
        code : 200,
        message: 'Berhasil Register',
        data: admin
      })
    } catch (error) {
      console.log('error')
      console.log(error)
      res.status(500).json({
        code : 500,
        message: 'Server sedang Sibuk'
      })
    }  
  }

  async updatePassword(req, res) {
    let {
      password, oldPassword
    } = req.body;
    const myprofile = req.admin;
    
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
      const passwordHash = await bcrypt.hash(password, 8)

      const admin = await Admin.updateOne({_id : myprofile._id},
      {
        $set :{
          password : passwordHash
        }
      });  
     
      const data = await getProfileAdminById(myprofile._id, 'noToken');
           
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

 async update(req, res) {
  let idAdmin = req.admin._id;
  let roleAdmin = req.admin.role;
  let oldPhoneNumber = req.admin.phoneNumber;
  let oldEmail = req.admin.email;
  let oldPassword = req.admin.password;

  const {
    fullName,
    email,
    phoneNumber,
    role,
    _id
  } = req.body;

  if (roleAdmin=="superadmin") {
    if (!_id || _id=="") {
      idAdmin = req.admin._id
    }else{
      idAdmin = _id;
      try {
        const oldAdminData = await getProfileAdminById(idAdmin, 'noToken');
        oldPhoneNumber = oldAdminData.phoneNumber;
        oldPassword = oldAdminData.password;
        oldEmail = oldAdminData.email;
        if (!oldAdminData._id) {
          return res.status(400).json({
            code : 400,
            message: 'Data Yang Ingin Diupdate Tidak Ditemukan , Periksa Id Anda'
          });
        }
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
  }

  if (!fullName) {
    return res.status(400).json({
      code : 400,
      message: 'Nama Dibutuhkan'
    });
  }
  if (!phoneNumber) {
    return res.status(400).json({
      code : 400,
      message: 'Phone Number Dibutuhkan'
    });
  }    
  if (!email) {
    return res.status(400).json({
      code : 400,
      message: 'Email Dibutuhkan'
    });
  }    
  if (!role) {
    return res.status(400).json({
      code : 400,
      message: 'Role Admin Dibutuhkan'
    });
  }

  if (phoneNumber.length <= 10) {
    return res.status(400).json({
      code : 400,
      message: 'Nomor HP yang anda masukkan tidak valid'        
    });
  }

  const isEmail = helpers.validateEmail(email);    
    
  if(isEmail !== true){
    return res.status(400).json({
      code : 400,
      message: "Email is not valid"
    });
  }

  const emailAdmin = await Admin.findOne(
    { $and: [ 
     {  $or: [
          { email : email }
        ] 
     },
     {  $or: [
          { email : {$ne : oldEmail} }
        ] 
     },
    ]
  }
  );
  const phoneNumberAdmin = await Admin.findOne({ 
    $and: [ 
      {  $or: [
          { phoneNumber : phoneNumber }
        ] 
      },
      {  $or: [
          { phoneNumber : {$ne : oldPhoneNumber} }
        ] 
      },
   ]
  });
    
  if (emailAdmin) {
    return res.status(400).json({
      code : 400,
      message: "Email is registered"
    });
  }      
  
  if (phoneNumberAdmin) {
    return res.status(400).json({
      code : 400,
      message: "Phone Number is registered"
    });
  }

  try {
    await Admin.updateOne( { _id : idAdmin },
      { $set: {
        fullName,
        email,
        phoneNumber,
        role : roleAdmin!="superadmin" ? "admin" : role
      } 
    })
    
    const admin = await getProfileAdminById(idAdmin, 'noToken');

    res.status(200).json({
      code : 200,
      message: 'Berhasil Update Data',
      data: admin
    })
  } catch (error) {
    console.log('error')
    console.log(error)
    res.status(500).json({
      code : 500,
      message: 'Server sedang Sibuk'
    })
  }  
}
//Akhir Update Admin
//Awal Delete Admin
async delete(req, res) {
  let roleAdmin = req.admin.role;
  if (roleAdmin!="superadmin") {
      return res.status(400).json({
        code : 400,
        message: 'Anda Tidak Memiliki Hak Untuk Menghapus Admin'
      });
  }
  try {
    await Admin.deleteOne({ _id: req.params.id})
    res.status(200).json({
      code : 200,
      message: 'Success delete admin',
      data: {
        admin : req.params.id,
      },
    })
  } catch (error) {
    res.status(400).json({
      error,
    })
  }
}

async read(req, res) {
  let id = req.admin._id;
  try {
    let data =await Admin.findOne({ _id: id})
    res.status(200).json({
      code : 200,
      message: 'Success Get My Profile',
      data
    })
  } catch (error) {
    res.status(400).json({
      error,
    })
  }
}

async uploadPhoto(req, res) { 
  const myprofile = req.admin;
  try {
      const file = req.file;
      if (!file) {
        res.status(400).send({
          status: false,
          data: "No File is selected.",
        });
      }
      let result = `${file.path}`;
      const admin = await Admin.updateOne({_id : myprofile._id},
        {
          $set :{
            profilePicture : result
          }
        });  
       
      const data = await getProfileAdminById(myprofile._id, 'noToken');
             
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

}


findAdminByemail = async (email, isToken) => {
  let token, data;
  const admin = await Admin.findOne({ email: email });
 
  try {
    if (isToken === 'noToken') {
      data = {
        _id: admin._id,
        fullName: admin.fullName,
        phoneNumber: admin.phoneNumber,
        password : admin.password,
        email : admin.email,
        role: admin.role
      }
      
    } else if (isToken === 'withToken') {
      token = await admin.generateAuthToken();
      data = {
        _id: admin._id,
        fullName: admin.fullName,
        email : admin.email,
        password : admin.password,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
        token
      }
    }    
    return data;
  } catch (error) {
    return error;
  }

}
//Awal Get Profile Admin By ID  
getProfileAdminById = async (id, isToken) => {
    let token, data;
    try {
      const admin = await Admin.findOne({ _id: id });
          
      if (isToken === 'noToken') {
        data = {
          _id: admin._id,
          fullName: admin.fullName,
          phoneNumber: admin.phoneNumber,
          email : admin.email,
          password : admin.password,
          role: admin.role,
          profilePicture : admin.profilePicture
        }
      } else if (isToken === 'withToken') {
        token = await admin.generateAuthToken();
        data = {
          _id: admin._id,
          fullName: admin.fullName,
          phoneNumber: admin.phoneNumber,
          email : admin.email,
          password : admin.password,
          role: admin.role,
          profilePicture : admin.profilePicture,
          token
        }
      }    
      return data;
    } catch (error) {
      return error;
    }
  }
//Akhir Get Profile Admin By ID  


module.exports = new AdminController;