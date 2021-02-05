const Category = require("../db/models/Category");

class CategoryController {
  async getAllCategory(req, res) {
    const user = req.user;
    const search = req.query.search ? req.query.search : ''
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const order_by  = req.query.order_by ? req.query.order_by : 'asc'
    const sort_by   = req.query.sort_by ? req.query.sort_by : 'name' 
    let query = {}, category, totalCategory, sortOrder = ''

    if (order_by == 'asc') {
      sortOrder = `${sort_by}`;
    } else if (order_by == 'desc') {
      sortOrder = `-${sort_by}`;
    } else {
      sortOrder = `-createdAt`;
    }

    try {
      const count = await Category.countDocuments()
      query = { 
        $or: 
          [ 
            {name :{ $regex: search, $options: "i" }},
          ]
      }
        
        category = await Category.find(query)
          .sort(`${sortOrder}`)
          .exec()

    
      totalCategory = category.length

       res.status(200).json({
        code : 200, 
        message: 'Success Get Category',
        data: {
          category,
          totalCategory
        },
      })
    } catch (error) {
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
      name
    } = req.body;

    if (!name) {
      return res.status(400).json({
        code : 400,
        message: 'Nama Kategori Dibutuhkan'
      });
    }
    
    const newCategory = new Category({
      name
    })

    try {
      let checkCategory = await Category.findOne({name : name});
      
      if(checkCategory){
        return res.status(400).json({
            code : 400,
            message: 'Category Sudah Berada Di Dalam Database',
          })          
      }

      await newCategory.save()

      res.status(200).json({
        code : 200,
        message: 'Success Add New Category'
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
    let category = req.params.id
    const {
      name
    } = req.body;

    if (!category) {
      return res.status(400).json({
        code : 400,
        message: 'Category Dibutuhkan'
      });
    }
    
    if (!name) {
        return res.status(400).json({
          code : 400,
          message: 'Nama Dibutuhkan'
        });
    }
   

    try {
      let checkCategory = await Category.findOne({_id : category});
      
      if(!checkCategory){
        return res.status(400).json({
            code : 400,
            message: 'Category Tidak Ada Didalam Database',
          })          
      }

      let updateCategory = await Category.updateOne({
       _id : category
       },{
        $set :{
            name
      }})

      res.status(200).json({
        code : 200,
        message: 'Success Updated Category'
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
        let checkCategory = await Category.findOne({_id : id});
        
        if(!checkCategory){
            return res.status(400).json({
                code : 400,
                message: 'Category Sudah Tidak Berada Di Dalam Database',
            })          
        }
  
        await Category.deleteOne({_id : id})
        
        res.status(200).json({
            code : 200,
            message: 'Success Remove Category From Database'
        })
    } catch (error) {
        res.status(400).json({
            error,
        })
    }
}

}

module.exports = new CategoryController;