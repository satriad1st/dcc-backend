const Product = require("../db/models/Product");

class ProductController {
  
  async getAllProduct(req, res) {
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const search = req.query.search ? req.query.search : ''
    const order_by  = req.query.order_by ? req.query.order_by : 'desc'
    const sort_by   = req.query.sort_by ? req.query.sort_by : 'createdAt' 
    let query = {}, product, totalProduct, sortOrder = ''

    if (order_by == 'asc') {
      sortOrder = `${sort_by}`;
    } else if (order_by == 'desc') {
      sortOrder = `-${sort_by}`;
    } else {
      sortOrder = `-createdAt`;
    }

    try {
        query = { $and :[
          {$or: 
            [ 
              {name :{ $regex: search, $options: "i" }},
              {merkProduct :{ $regex: search, $options: "i" }}
            ]
          },{$or: 
            [ 
              {isDeleted : false}
            ]
          }
          ]
        }

        const count = await Product.countDocuments(query)
        
          product = await Product.find(query).populate({
            path :'category',
            select : 'name'
          })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .sort(`${sortOrder}`)
          .exec()

    
      totalProduct = product.length

      res.status(200).json({
        code : 200,
        message: 'Success Get List Product',
        data: {
          product,
          totalProduct,
          totalPages: Math.ceil(count / limit),
          totalAllProduct : count,
          currentPage : page,
          limit
        },
      })
    } catch (error) {
      console.log(error)
      res.status(400).json({
        error,
      })
    }
  }
  //Akhir Get Product
  //Awal Create Product
  async create(req, res) {
    const {
      name,
      merkProduct,
      buyPrice,
      sellPrice,
      description,
      category,
      stock,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        code : 400,
        message: 'Nama Product Dibutuhkan'
      });
    }
    
    if (!merkProduct) {
        return res.status(400).json({
          code : 400,
          message: 'Merk Product Dibutuhkan'
        });
    }
    
    if (!buyPrice) {
        return res.status(400).json({
          code : 400,
          message: 'Harga Beli Dibutuhkan'
        });
    }

    if (!sellPrice) {
        return res.status(400).json({
          code : 400,
          message: 'Harga Jual Dibutuhkan'
        });
    }

    if (!description) {
        return res.status(400).json({
          code : 400,
          message: 'Description Dibutuhkan'
        });
    }

    if (!category) {
        return res.status(400).json({
          code : 400,
          message: 'Category Dibutuhkan'
        });
    }

    if (!stock) {
      return res.status(400).json({
        code : 400,
        message: 'Stock Dibutuhkan'
      });
    }
    
    const file = req.files;
    console.log(file)
    if (!file) {
      res.status(400).send({
        status: false,
        data: "No File is selected.",
      });
    }
    let result = file.map(a => `${a.path}`);
    
    const newProduct = new Product({
      name,
      merkProduct,
      buyPrice,
      sellPrice,
      description,
      category,
      images : result,
      stock
    })

    try {
      await newProduct.save()
      let data = await Product.findOne({_id : newProduct._id}).populate({
        path :'category',
        select : 'name'
      });
      res.status(200).json({
        code : 200,
        message: 'Success Add New Product',
        data : data
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
    const {
      name,
      merkProduct,
      buyPrice,
      sellPrice,
      description,
      category,
      stock,
    } = req.body;
    
    const id = req.params.id;

    if(!id){
      return res.status(400).json({
        code : 400,
        message: 'Id Product Dibutuhkan'
      });
    }

    if (!name) {
      return res.status(400).json({
        code : 400,
        message: 'Nama Product Dibutuhkan'
      });
    }
    
    if (!merkProduct) {
        return res.status(400).json({
          code : 400,
          message: 'Merk Product Dibutuhkan'
        });
    }
    
    if (!buyPrice) {
        return res.status(400).json({
          code : 400,
          message: 'Harga Beli Dibutuhkan'
        });
    }

    if (!sellPrice) {
        return res.status(400).json({
          code : 400,
          message: 'Harga Jual Dibutuhkan'
        });
    }

    if (!description) {
        return res.status(400).json({
          code : 400,
          message: 'Description Dibutuhkan'
        });
    }

    if (!category) {
        return res.status(400).json({
          code : 400,
          message: 'Category Dibutuhkan'
        });
    }

    if (!stock) {
      return res.status(400).json({
        code : 400,
        message: 'Stock Dibutuhkan'
      });
    }
    
    const file = req.files;
    if (!file) {
      res.status(400).send({
        status: false,
        data: "No File is selected.",
      });
    }
    let result = file.map(a => `${a.path}`);
    
    try {
      let update = await Product.updateOne({_id : id}, 
        { $set :
          {
            name,
            merkProduct,
            buyPrice,
            sellPrice,
            description,
            category,
            images : result,
            stock
          }
        }
      )
      let data = await Product.findOne({_id : id}).populate({
        path :'category',
        select : 'name'
      });
      res.status(200).json({
        code : 200,
        message: 'Success Updated Product',
        data : data
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
 //Akhir Create Product
 //Awal Update Product
 async detail(req, res) {
    const id = req.params.id;
    console.log(id)
    if(!id){
        return res.status(400).json({
            code : 400,
            message: 'Id Product Tidak Ditemukan'
        });
    }
    try {
        let data = await Product.findOne({_id : id, isDeleted : false}).populate({
          path :'category',
          select : 'name'
        });
        
        if (!data) {
          return res.status(400).json({
            code : 400,
            message: 'Data Product Tidak Ditemukan'
          });
        }
        
        return res.status(200).json({
            code : 200,
            message: 'Data Product Berhasil Dilihat',
            data 
        });
    }
      catch(error){
        console.log('error')
        console.log(error)
        res.status(500).json({
          code : 500,
          message: 'Server sedang Sibuk'
        })
    }
}

async uploadImage(req, res) { 
    const id = req.params.id;
    try {
        const file = req.files;
        if (!file) {
          res.status(400).send({
            status: false,
            data: "No File is selected.",
          });
        }
        let result = file.map(a => `${a.path}`);
        let update = await Product.updateOne({_id : id}, 
          { $set :
            {
              images : result
            }
          }
        )
        let data = await Product.findOne({_id : id}).populate({
          path :'category',
          select : 'name'
        });
        console.log(file);
        return res.status(200).json({
            code : 200,
            message: 'Success Change Images',
            data
        });
        
    }
      catch(error){
        console.log('error')
        console.log(error)
        res.status(500).json({
          code : 500,
          message: 'Server sedang Sibuk'
        })
    }
}
//Akhir Update Product
//Awal Delete Product
async delete(req, res) {
  try {
    await Product.updateOne({ _id: req.params.id},{
      $set :{
        isDeleted : true
      }
    })
    res.status(200).json({
      code : 200,
      message: 'Success delete Product',
      data: {
        product : req.params.id,
      },
    })
  } catch (error) {
    res.status(400).json({
      error,
    })
  }
}

}

module.exports = new ProductController;