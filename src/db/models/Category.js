const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
)

const Category = mongoose.model('Category', categorySchema)

module.exports = Category
