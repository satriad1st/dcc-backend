const router = require('express').Router();
const multer = require("multer");
const { isAuth } = require('../middlewares/auth_admin');
const { diskStorage  } = require('../middlewares/multer_upload');
const AdminController = require('../controllers/Admin.Controller');
const ProductController = require('../controllers/Product.Controller');
const CategoryController = require('../controllers/Category.Controller');
const OrderController = require('../controllers/Order.Controller');
const UserController = require('../controllers/User.Controller');
const ReportController = require('../controllers/Report.Controller');
//auth
router.post('/login', AdminController.login);
router.post('/logout', isAuth, AdminController.logout);

//admin
router.post('/create', isAuth, AdminController.create);
router.get('/read', isAuth, AdminController.getAllAdmin);
router.get('/me', isAuth, AdminController.read);
router.patch('/update', isAuth, AdminController.update);
router.patch('/me/password', isAuth, AdminController.updatePassword);
router.patch('/profile-picture', isAuth, multer({ storage: diskStorage }).single("photo"), AdminController.uploadPhoto);
router.delete('/delete/:id', isAuth, AdminController.delete);

//product
router.post('/product', isAuth, multer({ storage: diskStorage }).array("photo",10), ProductController.create);
router.post('/image-product/:id', isAuth,  multer({ storage: diskStorage }).array("photo",10),ProductController.uploadImage);
router.get('/product', ProductController.getAllProduct);
router.get('/product/:id',  ProductController.detail);
router.patch('/product/:id', isAuth, multer({ storage: diskStorage }).array("photo",10), ProductController.update);
router.delete('/product/:id', isAuth, ProductController.delete);

//category
router.post('/category', isAuth, CategoryController.create);
router.get('/category', isAuth, CategoryController.getAllCategory);
router.delete('/category/:id', isAuth, CategoryController.delete);
router.patch('/category/:id', isAuth, CategoryController.update);

router.get('/report', isAuth, ReportController.getMyOrderReport);

//order
router.patch('/confirmation-order/:id', isAuth, OrderController.confirmationOrder);
router.get('/order', isAuth, OrderController.getAllOrder);
router.get('/order/:id', isAuth, OrderController.detailOrderAdmin);
router.get('/user', isAuth, UserController.getAllUser);
router.get('/user/:id', isAuth, UserController.getDetailuser);
router.delete('/user/:id', isAuth, UserController.deleteUser);
router.patch('/user/:id', isAuth, UserController.resetPassword);
//router.delete('/order/:id', isAuth, CategoryController.delete);
router.post('/item-received', isAuth, multer({ storage: diskStorage }).single("proofItemReceived"), OrderController.uploadProofReceived);
module.exports = router;