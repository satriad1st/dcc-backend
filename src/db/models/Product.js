const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    merkProduct: {
      type: String
    },
    buyPrice: {
      type: Number,
      trim: true,
    },
    stock: {
      type: Number,
      default : 0
    },
    sellPrice: {
      type: Number,
      trim: true,
      default : 0
    },
    description: {
      type: String,
      default : '',
    },
    category: {
      type: ObjectId,
      ref: 'Category'
    },
    images: {
      type: [],
      trim: true,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default : false
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
)

const Product = mongoose.model('Product', productSchema)

module.exports = Product
