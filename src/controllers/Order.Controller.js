const Admin = require("../db/models/Admin");
const Order = require("../db/models/Order");
const Cart = require("../db/models/Cart");
const { validateProduct,updateStockProduct } = require('../service/OrderService');
const helpers = require('../helpers');
const { generateString, generateNumber } = require('../helpers/randomGenerator');
const {pushNotificationtoTopic} = require("../firebase/pushNotification")
class OrderController {
  
async getAllOrder(req, res) {
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const status = req.query.status ? req.query.status : ''
    const order_by  = req.query.order_by ? req.query.order_by : 'desc'
    const sort_by   = req.query.sort_by ? req.query.sort_by : 'createdAt' 
    let query = {}, order, totalOrder, sortOrder = ''

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
              {statusTransaction :{ $regex: status, $options: "i" }}
            ]
          }
          ]
        }

        const count = await Order.countDocuments(query)
        
          order = await Order.find(query).populate({
            path :'detailProducts.product',
            populate : 
              { 
                path: 'category'
              },
          })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .sort(`${sortOrder}`)
          .exec()

    
      totalOrder = order.length

      res.status(200).json({
        code : 200,
        message: 'Success Get List Order',
        data: {
          order,
          totalOrder,
          totalPages: Math.ceil(count / limit),
          totalAllOrder : count,
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
 
  async getMyOrder(req, res) {
    const user = req.user;
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const status = req.query.status ? req.query.status : ''
    const order_by  = req.query.order_by ? req.query.order_by : 'desc'
    const sort_by   = req.query.sort_by ? req.query.sort_by : 'createdAt' 
    let query = {}, order, totalOrder, sortOrder = ''

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
              {statusTransaction :{ $regex: status, $options: "i" }}
            ]
          },
          {$or: 
            [ 
              {user : user._id}
            ]
          }
          ]
        }

        const count = await Order.countDocuments(query)
        
          order = await Order.find(query).populate({
            path :'detailProducts.product',
            populate : 
              { 
                path: 'category'
              },
          })
          .limit(limit * 1)
          .skip((page - 1) * limit)
          .sort(`${sortOrder}`)
          .exec()

    
      totalOrder = order.length

      res.status(200).json({
        code : 200,
        message: 'Success Get List Order',
        data: {
          order,
          totalOrder,
          totalPages: Math.ceil(count / limit),
          totalAllOrder : count,
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

  //Akhir Get Order
  //Awal Create Order
  async create(req, res) {
    const user = req.user;
    const statusTransaction = 'menunggu-konfirmasi';
    let totalProducts = 0;
    let totalPrice = 0;
    let {
      orderNotes,
      detailProducts,
    } = req.body;

    
    if (!detailProducts) {
        return res.status(400).json({
          code : 400,
          message: 'Detail Product Dibutuhkan'
        });
    }
    
    if (detailProducts.length<1) {
        return res.status(400).json({
          code : 400,
          message: 'Setidaknya Ada 1 Product Yang Di Order'
        });
    }
    
    try {
        for (let i = 0; i < detailProducts.length; i++) {
            if (!detailProducts[i].product) {
              return res.status(400).json({
                code: 400,
                message: "Detail product id is required"
              });
            }
    
            let checkProduct = await validateProduct(detailProducts[i].product)
            if(!checkProduct){
              return res.status(400).json({
                code: 400,
                message: "Product Tidak Ditemukan Di Database"
              });
            }

            if (!detailProducts[i].count) {
              return res.status(400).json({
                code: 400,
                message: "Count detail product is required"
              });
            }
    
            if(checkProduct.stock < detailProducts[i].count){
              return res.status(400).json({
                code: 400,
                message: `Stock Tidak Cukup Untuk Product ${checkProduct.name}`
              });
            }
          
            totalProducts += Math.abs(detailProducts[i].count);
            detailProducts[i].price =  Math.abs(checkProduct.price);
            detailProducts[i].totalPrice =  Math.abs(checkProduct.price * detailProducts[i].count);
        }

        totalPrice = detailProducts.reduce((a, b) => a + (b.totalPrice || 0), 0);
        const transactionCode = `TRX-ODR-${helpers.getCurrentDateTime("-")}${generateString(6)}`;
        
        const dataTransaction = {
            transactionCode,
            user: user._id,
            orderNotes,
            totalItem : totalProducts,
            totalPrice,
            admin : null,
            detailProducts,
            statusTransaction,
        }
        const newTransaction = new Order(dataTransaction);
        await newTransaction.save();

        const data = await Order.findOne({_id : newTransaction._id});
        const stockNow = await updateStockProduct(newTransaction, 'dec');
        await Cart.deleteMany({ user: user._id})
        let payload = {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          title: "Ada Orderan Baru Nih!",
          message: `Halo admin , ada orderan nih dari ${user.name} , klik untuk selengkapnya.. `,
          description : `Halo admin , ada orderan nih dari ${user.name} , klik untuk selengkapnya.. `,
          type : 'order',
          sub_type: 'incoming_order',
          _id: `${data._id}`,
          topic : 'admin'
        }
        await pushNotificationtoTopic(payload);    
        res.status(200).json({
            code : 200,
            message: 'Success Add New Order',
            data 
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
 //Akhir Create Order
 async detailOrder(req, res) {
    const id = req.params.id;
    const user =req.user;
    if(!id){
        return res.status(400).json({
            code : 400,
            message: 'Id Order Tidak Ditemukan'
        });
    }

    try {
        let data = await Order.findOne({_id : id, user : user}).populate({
          path :'detailProducts.product',
          select : 'name images buyPrice description stock sellPrice',
          populate : 
              { 
                path: 'category'
              },
        });
        
        if (!data) {
          return res.status(400).json({
            code : 400,
            message: 'Data Product Tidak Ditemukan'
          });
        }
        
        return res.status(200).json({
            code : 200,
            message: 'Data Product Berhasil Ditemukan',
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

async detailOrderAdmin(req, res) {
  const id = req.params.id;
  const admin =req.admin;
  if(!id){
      return res.status(400).json({
          code : 400,
          message: 'Id Order Tidak Ditemukan'
      });
  }

  try {
      let data = await Order.findOne({_id : id}).populate({
        path :'detailProducts.product',
        select : 'name images buyPrice description stock sellPrice',
        populate : 
        { 
          path: 'category'
        },
      });
      
      if (!data) {
        return res.status(400).json({
          code : 400,
          message: 'Data Product Tidak Ditemukan'
        });
      }
      
      return res.status(200).json({
          code : 200,
          message: 'Data Product Berhasil Ditemukan',
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


async cancelled(req, res) {
  const user = req.user;
  const id = req.params.id;
  let {
      cancelReason
  } = req.body

  if (!id) {
    return res.status(400).json({
      code : 400,
      message: 'Id Order Dibutuhkan'
    });
  }

  if (!cancelReason) {
    return res.status(400).json({
      code : 400,
      message: 'Alasan Cancel Dibutuhkan'
    });
  }

  try {

    let order = await Order.findOne({_id : id , user :user._id}).select("statusTransaction");

    if(!order){
        return res.status(400).json({
            code : 400,
            message: 'Transaksi Tidak Ditermukan'
        });
    }

    if(order.statusTransaction!='menunggu-konfirmasi'){
        return res.status(400).json({
            code : 400,
            message: 'Transaksi Ini Sudah Tidak Dapat Dibatalkan'
        });
    }

    await Order.updateOne({ _id: req.params.id},{
      $set :{
        statusTransaction : 'dibatalkan',
        cancelReason 
      }
    })

    const data = await Order.findOne({_id : req.params.id});
    const stockNow = await updateStockProduct(data, 'inc');
    let payload = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      title: "Yahh Customer Kamu Cancel Nih!",
      message: `Halo admin orderan dari ${user.name} di cancel nih , klik untuk selengkapnya.. `,
      description :`Halo admin orderan dari ${user.name} di cancel nih , klik untuk selengkapnya.. `,
      type : 'order',
      sub_type: 'cancel_order',
      _id: `${data._id}`,
      topic : 'admin'
    }
    await pushNotificationtoTopic(payload);    
    res.status(200).json({
      code : 200,
      message: 'Success Cancelled Order',
      data
    })
  } catch (error) {
    res.status(400).json({
      error,
    })
  }
}

async confirmationOrder(req, res) {
    const admin = req.admin;
    const id = req.params.id;
    let {
        cancelReason,
        status 
    } = req.body
  
    if (!id) {
      return res.status(400).json({
        code : 400,
        message: 'Id Order Dibutuhkan'
      });
    }

    if (!status) {
        return res.status(400).json({
          code : 400,
          message: 'Status Dibutuhkan'
        });
    }
    
    if (status!="tolak" && status!="terima") {
        return res.status(400).json({
          code : 400,
          message: 'Status Tidak Valid'
        });
    }

    if (!cancelReason && status=="tolak") {
      return res.status(400).json({
        code : 400,
        message: 'Alasan Ditolak Dibutuhkan'
      });
    }
  
    try {
  
      let order = await Order.findOne({_id : id }).select("statusTransaction");
  
      if(!order){
          return res.status(400).json({
              code : 400,
              message: 'Transaksi Tidak Ditermukan'
          });
      }
  
      if(order.statusTransaction=='selesai' || order.statusTransaction=='sudah-diterima' || order.statusTransaction=='dibatalkan'){
          return res.status(400).json({
              code : 400,
              message: 'Transaksi Ini Sudah Tidak Dapat Dibatalkan'
          });
      }
  
      await Order.updateOne({ _id: req.params.id},{
        $set :{
          statusTransaction : status=="tolak" ? "dibatalkan" : "menunggu-kedatangan",
          admin : admin._id,
          cancelReason 
        }
      })
  
      const data = await Order.findOne({_id : req.params.id}).populate('user');
      if(status=="tolak"){
        const stockNow = await updateStockProduct(data, 'inc');
        let payload = {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          title: "Yahh Admin Gabisa Terima Order Kamu!",
          message: `Halo ${data.user.name} orderan dari kamu ditolak admin nih, klik untuk selengkapnya.. `,
          description :`Halo ${data.user.name} orderan dari kamu ditolak admin nih, klik untuk selengkapnya.. `,
          type : 'order',
          sub_type: 'reject_order',
          _id: `${data._id}`,
          topic : `${data.user._id}`
        }
        await pushNotificationtoTopic(payload);
      }else{
        let payload = {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          title: "Horray Orderan Kamu Sedang Diproses Admin!",
          message: `Halo ${data.user.name} orderan dari kamu sedang diproses, klik untuk selengkapnya.. `,
          description :`Halo ${data.user.name} orderan dari kamu sedang diproses, klik untuk selengkapnya.. `,
          type : 'order',
          sub_type: 'accepted_order',
          _id: `${data._id}`,
          topic : `${data.user._id}`
        }
        await pushNotificationtoTopic(payload);    
      }
      res.status(200).json({
        code : 200,
        message: 'Success Confirmation Order',
        data
      })
    } catch (error) {
      res.status(400).json({
        error,
      })
    }
  }
 
  async transactionDone(req, res) {
    const user = req.user;
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        code : 400,
        message: 'Id Order Dibutuhkan'
      });
    }

    try {
  
      let order = await Order.findOne({_id : id , user : user._id }).select("statusTransaction");
  
      if(!order){
          return res.status(400).json({
              code : 400,
              message: 'Transaksi Tidak Ditermukan'
          });
      }
  
      if(order.statusTransaction!='sudah-diterima'){
          return res.status(400).json({
              code : 400,
              message: 'Transaksi Ini Tidak Dapat Diselesaikan'
          });
      }
  
      await Order.updateOne({ _id: id},{
        $set :{
          statusTransaction : 'selesai'
        }
      })
  
      const data = await Order.findOne({_id : id});
      let payload = {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        title: "Orderan Sudah Selesai!",
        message: `Halo admin ${user.name} telah menyelesaikan order, klik untuk selengkapnya.. `,
        description :`Halo admin ${user.name} telah menyelesaikan order, klik untuk selengkapnya.. `,
        type : 'order',
        sub_type: 'order_done',
        _id: `${data._id}`,
        topic : 'admin'
      }
      await pushNotificationtoTopic(payload);
      res.status(200).json({
        code : 200,
        message: 'Success Menyelesaikan Order',
        data
      })
    } catch (error) {
      res.status(400).json({
        error,
      })
    }
  }

  
async updateReview(req, res) {
    const user = req.user;
    const id = req.params.id;
    let {
        review,
        rating 
    } = req.body
  
    if (!id) {
      return res.status(400).json({
        code : 400,
        message: 'Id Order Dibutuhkan'
      });
    }

    if (!rating) {
        return res.status(400).json({
          code : 400,
          message: 'Rating Dibutuhkan'
        });
    }
    
    if (!review) {
      return res.status(400).json({
        code : 400,
        message: 'Review Dibutuhkan'
      });
    }

    if (rating<1) {
        return res.status(400).json({
          code : 400,
          message: 'Rating Setidaknya Lebih Besar Atau 1'
        });
    }
  
    try {
  
      let order = await Order.findOne({_id : id, user : user._id }).select("statusTransaction");
  
      if(!order){
          return res.status(400).json({
              code : 400,
              message: 'Transaksi Tidak Ditermukan'
          });
      }
  
      if(order.statusTransaction!='selesai'){
          return res.status(400).json({
              code : 400,
              message: 'Transaksi Ini Belum Bisa Diberikan Review'
          });
      }
  
      await Order.updateOne({ _id: id},{
        $set :{
          ulasan : review,
          rating
        }
      })
  
      const data = await Order.findOne({_id : id});
      let payload = {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        title: "Ada Ulasan nih buat kamu!",
        message: `Halo admin ${user.name} sudah memberikan review dan rating nih, klik untuk selengkapnya.. `,
        description : `Halo admin ${user.name} sudah memberikan review dan rating nih, klik untuk selengkapnya.. `,
        type : 'order',
        sub_type: 'review',
        _id: `${data._id}`,
        topic : 'admin'
      }
      await pushNotificationtoTopic(payload);
      
      res.status(200).json({
        code : 200,
        message: 'Success Memberikan Rating Dan Ulasan',
        data
      })
    } catch (error) {
      res.status(400).json({
        error,
      })
    }
  }

async uploadProofReceived(req, res) { 
    const order = req.body.order;

    if(!order){
        res.status(400).send({
            status: false,
            data: "Order Id Is Required",
        });
    }
    try {
        const file = req.file;
        if (!file) {
          res.status(400).send({
            status: false,
            data: "No File is selected.",
          });
        }
        let result = `${file.path}`;
        const updateOrder = await Order.updateOne({_id : order},
          {
            $set :{
              proofItemReceived : result,
              statusTransaction : 'sudah-diterima'
            }
          });  
         
          
        const data = await Order.findOne({_id : order }).populate('user');
          
        let payload = {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          title: "Bukti Kedatanganmu Diunggah",
          message: `Halo ${data.user.name} bukti kedatanganmu sudah diunggah admin, klik untuk selengkapnya.. `,
          description :`Halo ${data.user.name} bukti kedatanganmu sudah diunggah admin, klik untuk selengkapnya.. `,
          type : 'order',
          sub_type: 'come_to_shop',
          _id: `${data._id}`,
          topic : `${data.user._id}`
        }
        await pushNotificationtoTopic(payload);
        return res.status(200).json({
            code : 200,
            message: 'Success Uploading Bukti Diterima',
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
}

module.exports = new OrderController;