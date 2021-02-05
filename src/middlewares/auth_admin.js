const jwt = require('jsonwebtoken')
const Admin = require('../db/models/Admin')

const isAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    const data = jwt.verify(token, process.env.JWT_KEY)
    const admin = await Admin.findOne({ _id: data._id })
    console.log(req.body)
    if (!admin) {
      return res.status(401).send({
        success: 'false',
        message: 'Not authorized to access this resource',
      })
    }
    req.admin = admin
    req.token = token
    next()
  } catch (error) {
    res.status(401).send({ error: 'Not authorized to access this resource' })
  }
}

module.exports = {
  isAuth,
}
