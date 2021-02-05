const User = require('../db/models/User')
const config = require('../config/config.json')
const helpers = require('../helpers')

exports.getProfileUser = async (id, isToken) => {
  let token, data;   
  try {
    const userUpdated = await User.findOne({ _id: id }).populate('chart');
    if (isToken === 'noToken') {
      data = {
        _id: userUpdated._id,
        name: userUpdated.name,
        phoneNumber: userUpdated.phoneNumber,
        email: userUpdated.email,
        gender: userUpdated.gender,
        placeOfBirth: userUpdated.placeOfBirth ? userUpdated.placeOfBirth : null,
        dateOfBirth: userUpdated.dateOfBirth ? userUpdated.dateOfBirth : null,
        address: userUpdated.address,
        isActive: userUpdated.isActive,
        photoProfile : userUpdated.photoProfile,
      }
    } else if (isToken === 'withToken') {
      token = await userUpdated.generateAuthToken();
      data = {
        _id: userUpdated._id,
        name: userUpdated.name,
        phoneNumber: userUpdated.phoneNumber,
        email: userUpdated.email,
        gender: userUpdated.gender,
        placeOfBirth: userUpdated.placeOfBirth ? userUpdated.placeOfBirth : null,
        dateOfBirth: userUpdated.dateOfBirth ? userUpdated.dateOfBirth : null,
        address: userUpdated.address,isActive: userUpdated.isActive,
        photoProfile : userUpdated.photoProfile,
        token
      }
    }    
    return data;
  } catch (error) {
    console.log(error)
    return error;
  }
}

exports.checkPhoneNumber = async function (phoneNumber) {
  try {
    let newFormat = helpers.formatNumberDefaultIndo(phoneNumber);
    return newFormat;
  } catch (error) {
    return error;
  }
}