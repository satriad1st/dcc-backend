const jwt = require('jsonwebtoken');
const User = require('../db/models/User');

const isAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const data = jwt.verify(token, process.env.JWT_KEY);
        const user = await User.findOne({ _id: data._id });
        if (!user) {            
            return res.status(401).send({
                message: 'Not authorized to access this resource'
            });
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({            
            message: 'Not authorized to access this resource'
        });
    }
}

module.exports = {
    isAuth
}