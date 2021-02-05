const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const { ObjectId } = mongoose.Schema

const adminSchema = mongoose.Schema({
  fullName: {
      type: String,
      required: true,
      trim: true
  },
  email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: value => {
        if (!validator.isEmail(value)) {
            throw new Error({error: 'Invalid Email address'})
        }
      }
  },
  password: {
    type: String,
    required: true,
    minLength: 7,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    minLength: 10
  },  
  role: {
    type: String,
    required: true,
    trim: true
  },
  fcmToken: {
    type: String,
    trim: true,
    default : ''
  },
  profilePicture: {
    type: String,
    default : ''
  }
},
{
  timestamps: { createdAt: true, updatedAt: true }
});

adminSchema.methods.generateAuthToken = async function() {
  const admin = this;
  const token = jwt.sign({_id: admin._id}, process.env.JWT_KEY);
  return token;
}

adminSchema.pre('save', async function (next) {
    // Hash the password before saving to the admin model
    const admin = this
    if (admin.isModified('password')) {
        admin.password = await bcrypt.hash(admin.password, 8)
    }
    next()
})


adminSchema.statics.findByCredentials = async (email, password) => {
    // Searching a admin by email and password
    const admin = await Admin.findOne({ email })
    if (!admin) {
      //throw new Error({ error: 'Invalid login credentials' })
        return 401;
    }else{
        const isPasswordMatch = await bcrypt.compare(password, admin.password)
        if (!isPasswordMatch) {
        //throw new Error({ error: 'Invalid login credentials' })
        return 400;
     }
    }
    return admin
}
  
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;