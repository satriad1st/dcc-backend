const router = require('express').Router()
const { isAuth } = require('../middlewares/auth_user');
const multer = require("multer");
const { diskStorage } = require('../middlewares/multer_upload');
const UserController = require('../controllers/User.Controller')
const ProductController = require('../controllers/Product.Controller');
const ChartController = require('../controllers/Cart.Controller');
const CategoryController = require('../controllers/Category.Controller');
const OrderController = require('../controllers/Order.Controller');
//Auth
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/me', isAuth, UserController.me);
router.patch('/me', isAuth, UserController.updateProfile);
router.patch('/me/password', isAuth, UserController.updatePassword);
router.patch('/profile-picture', isAuth, multer({ storage: diskStorage }).single("photo"), UserController.uploadPhoto);
//Product
router.get('/product', isAuth, ProductController.getAllProduct);
router.get('/product/:id', isAuth, ProductController.detail);

//Cart
router.post('/cart', isAuth, ChartController.create);
router.get('/cart', isAuth, ChartController.getAllCart);
router.delete('/cart/:id', isAuth, ChartController.delete);
router.patch('/cart/:id', isAuth, ChartController.update);

//Category
router.get('/category', isAuth, CategoryController.getAllCategory);


//Order
router.post('/order', isAuth, OrderController.create);
router.get('/order', isAuth, OrderController.getMyOrder);
router.patch('/order/:id', isAuth, OrderController.cancelled);
router.patch('/order-review/:id', isAuth, OrderController.updateReview);
router.get('/order/:id', isAuth, OrderController.detailOrder);
router.put('/order/:id', isAuth, OrderController.transactionDone);

module.exports = router
