const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const orderSchema = mongoose.Schema(
  {
    transactionCode: {
        type: String,
        unique: true,
        require: true
    },
    orderNotes: {
        type: String,
        default : ''
    },
    user: {
        type: ObjectId,
        ref: 'User'
    },
    admin: {
        type: ObjectId,
        ref: 'Admin',
        default : null
    },
    totalPrice :{
        type : Number,
        default : 0
    },
    totalItem :{
        type : Number,
        default : 0
    },
    detailProducts: [{
        count : {
          type: Number,
          require: true
        },
        price : {
          type: Number,
          require: true
        },
        totalPrice : {
          type: Number,
          require: true
        },
        product: {
          type: ObjectId,
          ref: 'Product',
          require: true
        }
    }],
    statusTransaction: {
        type: String,
        require: true
    },
    rating :{
        type : Number,
        default : 0
    },
    ulasan: {
        type: String,
        default : ''
    },
    paymentMethod: {
        type: String,
        default : 'cod'
    },
    proofTransactionBill: {
        type: String,
        default : ''
    },
    proofItemReceived: {
        type: String,
        default : ''
    },
    cancelReason: {
        type: String,
        default : ''
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
)

const Order = mongoose.model('Order', orderSchema)

module.exports = Order
