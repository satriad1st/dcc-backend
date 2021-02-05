const Order = require("../db/models/Order");
const Product = require("../db/models/Product");
class ReportController {
  
async getMyOrderReport(req, res) {
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const search = req.query.search ? req.query.search : ''
    const order_by  = req.query.order_by ? req.query.order_by : 'desc'
    const sort_by   = req.query.sort_by ? req.query.sort_by : 'createdAt' 
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : new Date()
    const toDate = req.query.toDate ? new Date(req.query.toDate) : new Date()
    let totalData,sortOrder;
    if (order_by == 'asc') {
      sortOrder = `${sort_by}`;
    } else if (order_by == 'desc') {
      sortOrder = `-${sort_by}`;
    } else {
      sortOrder = `-createdAt`;
    }

    try {
        let aggregateOrder = { 
            "$lookup": {
              "from": "orders",
              "let": { "id": "$_id" },
              "pipeline": [
                { "$match": { "$expr": { "$in": ["$$id", "$detailProducts.product"] } } },
                { "$unwind": "$detailProducts" },
                { "$match": { "$expr": { "$eq": ["$detailProducts.product", "$$id"] } } },  { "$group": {
                  "_id": "$detailProducts.product",
                  "totalDone": { "$sum": 
                    {$cond: [
                      {$and :[
                        {$or: [{$eq: ['$statusTransaction', 'selesai']}]},
                        {$or :[{$gte: ['$createdAt', new Date(fromDate.getFullYear(),fromDate.getMonth(),fromDate.getDate(),0,0,0)]}]},
                        {$or :[{$lt: ['$createdAt', new Date(toDate.getFullYear(),toDate.getMonth(),toDate.getDate(),23,59,59)]}]}
                      ]}, "$detailProducts.count", 0]}, },
                  "totalPendapatan": { "$sum": 
                    {$cond: [
                      {$and :[
                        {$or: [{$eq: ['$statusTransaction', 'selesai']}]},
                        {$or :[{$gte: ['$createdAt', new Date(fromDate.getFullYear(),fromDate.getMonth(),fromDate.getDate(),0,0,0)]}]},
                        {$or :[{$lt: ['$createdAt', new Date(toDate.getFullYear(),toDate.getMonth(),toDate.getDate(),23,59,59)]}]}
                      ]}, "$totalPrice" , 0]}, },
                  "totalDibatalkan": { "$sum": {$cond: [
                    {$and :[
                      {$or: [{$eq: ['$statusTransaction', 'dibatalkan']}]},
                      {$or :[{$gte: ['$createdAt', new Date(fromDate.getFullYear(),fromDate.getMonth(),fromDate.getDate(),0,0,0)]}]},
                      {$or :[{$lt: ['$createdAt', new Date(toDate.getFullYear(),toDate.getMonth(),toDate.getDate(),23,59,59)]}]}
                    ]}, 1, 0]}, },
                    "createdAt" : { "$first": '$createdAt' }
                }},
                { "$project":
                  { "_id": 1,
                    "totalDone": { $ifNull : ["$totalDone", 0] },
                    "totalDibatalkan": { $ifNull : ["$totalDibatalkan", 0] },
                    "totalPendapatan" : 1,
                    "createdAt" : 1
                  } 
                },
              ],
              "as": "orders"
            }
          }
          
        let myReport = await Product.aggregate([  
            aggregateOrder,
            {
              $unwind :{'path' : "$orders",'preserveNullAndEmptyArrays': true } 
            },
            { $match:
              { $and: [ 
                { $or: [
                    {createdAt: {
                      $gte: new Date(fromDate.getFullYear(),fromDate.getMonth(),fromDate.getDate(),0,0,0),
                      $lt: new Date(toDate.getFullYear(),toDate.getMonth(),toDate.getDate(),23,59,59)
                    }
                    }]
                },
              ]
            }
            },
            {
              $project :{
                name : 1,
                images : 1,
                totalDone : { $ifNull : ["$orders.totalDone", 0] },
                totalDibatalkan : { $ifNull : ["$orders.totalDibatalkan", 0] },
                totalPendapatan : { $ifNull : ["$orders.totalPendapatan", 0] },
                stock : 1,
                merkProduct : 1,
                sellPrice : 1,
                buyPrice : 1
              }
            },
        ])

      totalData = myReport.length

      res.status(200).json({
        code : 200,
        message: 'Success Get Report',
        data: {
          myReport,
          totalData,
          fromDate,
          toDate
        },
      })
    } catch (error) {
      console.log(error)
      res.status(400).json({
        error,
      })
    }
  }
}

module.exports = new ReportController;