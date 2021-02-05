const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const { ObjectId } = mongoose.Schema;

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    minLength: 10
  },
  address: {
    type: String,
    trim: true,
    default : ''
  },
  fcmToken: {
    type: String,
    trim: true,
    default : ''
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
  gender: {
    type: String,
    trim: true,
    default : ''
  },
  placeOfBirth: {
    type: String,    
    trim: true,
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null    
  },   
  isActive: {
    type: Boolean,
    default: true
  },  
  photoProfile: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  }
},
{
  timestamps: { createdAt: true, updatedAt: true }
});

userSchema.methods.generateAuthToken = async function() {
  // Generating an auth token for the user
  const user = this;
  const token = jwt.sign({_id: user._id}, process.env.JWT_KEY);
  return token;
}

const User = mongoose.model('User', userSchema);

module.exports = User;