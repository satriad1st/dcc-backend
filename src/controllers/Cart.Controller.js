const Cart = require("../db/models/Cart");
const Product = require("../db/models/Product");
class CartController {
  
  async getAllCart(req, res) {
    const user = req.user;
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const search = req.query.search ? req.query.search : ''
    const order_by  = req.query.order_by ? req.query.order_by : 'desc'
    const sort_by   = req.query.sort_by ? req.query.sort_by : 'createdAt' 
    let query = {}, cart, totalCart, sortOrder = ''

    if (order_by == 'asc') {
      sortOrder = `${sort_by}`;
    } else if (order_by == 'desc') {
      sortOrder = `-${sort_by}`;
    } else {
      sortOrder = `-createdAt`;
    }

    try {
        cart = await Cart.aggregate([
          {
            $lookup: {
              from: 'products',
              localField: 'product',
              foreignField: '_id',
              as: 'product'
            }
          },
          {
            $unwind: "$product"
          },{ $match:
            { $and: [
              { $or: [ {'user': user._id } ]},
              { $or: [ {'product.name': {$regex: search, $options: "i" }}]},
              { $or: [ {'product.isDeleted': false } ]}
            ]
          }
          },{
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: "$user"
          },
        ]);

    
      totalCart = cart.length
      
      let totalCost = 0
      
      if(totalCart>0){
        totalCost = cart.reduce((a, b) => a + ((b.product.sellPrice * b.quantity) || 0), 0);
      }
      
      res.status(200).json({
        code : 200, 
        message: 'Success Get List Cart',
        data: {
          cart,
          totalCart,
          totalCost
        },
      })
    } catch (error) {
      console.log(error)
      res.status(400).json({
        error,
      })
    }
  }
  //Akhir Get Cart
  //Awal Create Cart
  async create(req, res) {
    let user = req.user;
    const {
      product,
      quantity
    } = req.body;

    if (!product) {
      return res.status(400).json({
        code : 400,
        message: 'Product Dibutuhkan'
      });
    }
    
    if (!quantity || quantity<1) {
        return res.status(400).json({
          code : 400,
          message: 'Quantity Dibutuhkan'
        });
    }
    
    const newCart = new Cart({
      user,
      product,
      quantity
    })

    try {

      let checkProduct = await Product.findOne({_id : product, isDeleted: false})

      if(!checkProduct){
        return res.status(400).json({
            code : 400,
            message: 'Product Tidak Dapat Ditemukan Didatabase',
          })          
      }

      let checkCart = await Cart.findOne({user : user, product : product});
      
      if(checkCart){
        return res.status(400).json({
            code : 400,
            message: 'Product Sudah Berada Di Dalam Cart',
          })          
      }

      await newCart.save()

      let cart = await Cart.find({user : user}).populate({path :'user'}).populate({path :'product'});
      
      let totalCart = cart.length
      
      let totalCost = 0
      
      if(totalCart>0){
        totalCost = cart.reduce((a, b) => a + ((b.product.sellPrice * b.quantity) || 0), 0);
      }
      
      res.status(200).json({
        code : 200, 
        message: 'Success Add New Product To Cart',
        data: {
          cart,
          totalCart,
          totalCost
        },
      })
    } catch (error) {
      console.log('error')
      console.log(error)
      res.status(500).json({
        code : 500,
        message: 'Server sedang Sibuk'
      })
    }  
  }
  
  async update(req, res) {
    let user = req.user;
    let product = req.params.id
    const {
      quantity
    } = req.body;

    if (!product) {
      return res.status(400).json({
        code : 400,
        message: 'Product Dibutuhkan'
      });
    }
    
    if (!quantity || quantity<1) {
        return res.status(400).json({
          code : 400,
          message: 'Quantity Dibutuhkan'
        });
    }
   

    try {
      let checkProduct = await Product.findOne({_id : product, isDeleted: false})

      if(!checkProduct){
        return res.status(400).json({
            code : 400,
            message: 'Product Tidak Dapat Ditemukan Didatabase',
          })          
      }
      
      let checkCart = await Cart.findOne({user : user, product : product});
      
      if(!checkCart){
        return res.status(400).json({
            code : 400,
            message: 'Product Tidak Ada Didalam Cart',
          })          
      }

      let updateCart = await Cart.updateOne({
        user : user, product : product
      },{
        $set :{
            user,
            product,
            quantity
      }})

      let cart = await Cart.find({user : user}).populate({path :'user'}).populate({path :'product'});
      
      let totalCart = cart.length
      
      let totalCost = 0
      
      if(totalCart>0){
        totalCost = cart.reduce((a, b) => a + ((b.product.sellPrice * b.quantity) || 0), 0);
      }
      
      res.status(200).json({
        code : 200, 
        message: 'Success Updated Cart',
        data: {
          cart,
          totalCart,
          totalCost
        },
      })
    } catch (error) {
      console.log('error')
      console.log(error)
      res.status(500).json({
        code : 500,
        message: 'Server sedang Sibuk'
      })
    }  
  }
  
async delete(req, res) {
    const id = req.params.id;
    const user = req.user;
    try {
        let checkCart = await Cart.findOne({user : user._id, product : id});
        
        if(!checkCart){
            return res.status(400).json({
                code : 400,
                message: 'Product Sudah Tidak Berada Di Dalam Cart',
            })          
        }
  
        await Cart.deleteOne({ user: user._id,product : id})
        
        let cart = await Cart.find({user : user}).populate({path :'user'}).populate({path :'product'});
      
        let totalCart = cart.length
      
        let totalCost = 0
      
        if(totalCart>0){
          totalCost = cart.reduce((a, b) => a + ((b.product.sellPrice * b.quantity) || 0), 0);
        }
      
      res.status(200).json({
        code : 200, 
        message: 'Success Remove Product From Cart',
        data: {
          cart,
          totalCart,
          totalCost
        },
      })
    } catch (error) {
        res.status(400).json({
            error,
        })
    }
}

}

module.exports = new CartController;