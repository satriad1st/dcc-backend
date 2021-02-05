const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema

const cartSchema = mongoose.Schema(
  {
    user: {
        type: ObjectId,
        ref: 'User'
    },
    product: {
        type: ObjectId,
        ref: 'Product'
    },
    quantity: {
      type: Number,
      default : 1
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
)

const Chart = mongoose.model('Chart', cartSchema)

module.exports = Chart
