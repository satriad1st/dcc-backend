const Product = require('../db/models/Product')
const helpers = require('../helpers')

exports.validateProduct = async function (id) {
    let product
    let fixData 
    try {
      product = await Product.findOne({
        _id: id , isDeleted : false
      })
        fixData = {
          stock : product.stock,
          price : product.sellPrice,
          name : product.name
        }
    
      return fixData;
    } catch (error) {
      product = null;
      return product;
    }
}

exports.updateStockProduct = async function (data,type='inc') {
    let product
    let reproduceData =[]
    try {
     for (const [index, product] of data.detailProducts.entries()) {  
         let response = await exports.updateRegularStock(product,type);
         reproduceData.push({
           ...response,
           product : product.product.name})
     }
      return reproduceData;
    } catch (error) {
      product = {};
      return product;
    }
}


exports.updateRegularStock = async function (data,type="inc") {
    let product
    try {
      product = await Product.updateOne({
        _id : data.product._id
      },
      { 
        $inc: { stock: type=="dec" ? -data.count : data.count  } 
      });
      return product;
    } catch (error) {
      product = {};
      return product;
    }
  }
