const Product = require('../models/product')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const APIFeatures = require('../utils/apiFeatures')


//CREATE NEW PRODUCT => /api/v1/admin/product/new

exports.newProduct = catchAsyncErrors (async (req, res, next) => {

    req.body.user = req.user.id

    const product = await Product.create(req.body)

    res.status(201).json({
        success: true,
        product
    })

})

// GET ALL PRODUCTS => /api/v1/products?keyword=apple

exports.getProducts = catchAsyncErrors (async (req, res, next) => {

     //return next(new ErrorHandler('my error', 400))
    const resPerPage = 4;
    const productsCount = await Product.countDocuments()
    const apiFeatures = new APIFeatures(Product.find(), req.query)
        .search()
        .filter()
        
    let products = await apiFeatures.query
    let filteredProductsCount = products.length

    apiFeatures.pagination(resPerPage)
    products = await apiFeatures.query

    //const products = await apiFeatures.query

    // if(products.length === 0){
    //     return  res.status(400).json({
    //             success: false,
    //             message: 'cannot get products from database'
    //         })
    // }

    res.status(200).json({
        success: true,
        productsCount,
        resPerPage,
        filteredProductsCount,
        products
    })

})

//GET SINGLE PRODUCT DETAILS => api/v1/product/:id

exports.getSingleProduct =  catchAsyncErrors (async (req, res, next) => {

    const { id } = req.params
    const product = await Product.findById(id)
    
    if(!product){    
        return next(new ErrorHandler('Product not found', 404))
    }

    res.status(200).json({
        success: true,
        product
    })

})

//UDPDATE PRODUCT => api/v1/admin/product/:id

exports.updateProduct = catchAsyncErrors (async (req, res, next) => {
        const { id } = req.params
        const product = await Product.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        })

        if(!product){
            return next(new ErrorHandler('Product not found', 404))
        }

        res.status(200).json({
            success: true,
            product
        })

})

//DELETE PRODUCT => api/v1/admin/product/:id

exports.deleteProduct = catchAsyncErrors (async (req, res, next) => {

    const { id } = req.params
    const product = await Product.findByIdAndRemove(id)

    // await product.remove();

    if(!product){ 
        return next(new ErrorHandler('Product not found', 404))
    }

    res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
    })

})


//CREATE NEW REVIEW => /api/v1/review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {

    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()
    )

    if (isReviewed) {
        product.reviews.forEach(review => {
            if (review.user.toString() === req.user._id.toString()) {
                review.comment = comment;
                review.rating = rating;
            }
        })

    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length
    }

    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        product
    })

})

//GET PRODUCT REVIEWS => /api/v1/reviews
exports.getProductReviews = catchAsyncErrors (async (req, res, next) => {
    const product = await Product.findById(req.query.id)

    // if(product.reviews.length === 0){
    //     return next(new ErrorHandler('No reviews yet'))
    // }

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})

//DELETE PRODUCT REVIEWS => /api/v1/reviews
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {

    const product = await Product.findById(req.query.productId);

    console.log(product);

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})