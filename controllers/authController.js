const User = require('../models/user')

const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const sendToken = require('../utils/jwtToken')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')
const cloudinary = require('cloudinary')

//REGISTER USER = /api/v1/register
exports.registerUser = catchAsyncErrors(async (req, res, next) => {

    // const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
    //     folder: 'avatars',
    //     width: 150,
    //     crop: "scale"
    // })
    

    const { name, email, password } = req.body;
    console.log(req.body)
    const user = await User.create({
        name,
        email,
        password,
        // avatar: {
        //     public_id: result.public_id,
        //     url: result.secure_url
        // }
    })

    sendToken(user, 200, res)

})

//LOGIN USER => /api/v1/login

exports.loginUser = catchAsyncErrors (async (req, res, next) => {
    const { email, password } = req.body

    //a. Checks if email and password is entered by user
    if(!email || !password){
        return next(new ErrorHandler('Please enter email & password', 400))
    }

    //b. Finding user in database
    const user = await User.findOne({ email }).select('+password')

    if(!user) {
        return next(new ErrorHandler('Invalid Email or Password', 401))
    }

    //c. Checks if password is correct or not
    const isPasswordMatched = await user.comparePassword(password)

    if(!isPasswordMatched) {
        return next(new ErrorHandler('Invalid Email or Password', 401))
    }

    sendToken(user, 200, res)
})

//FORGOT PASSWORD => /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors (async (req, res, next) => {
    const { email } = req.body
    const user = await User.findOne({email})

    if(!user){
        return next(new ErrorHandler('User not found', 404))
    }

    //a. Get reset token
    const resetToken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    //b. Create reset password url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`

    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`

    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIt Password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        })
    } catch(error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save({ validateBeforeSave: false })

        return next(new ErrorHandler(error.message, 500))
    }
})

//RESET PASSWORD => /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors (async (req, res, next) => {
    //a. Hash URL token
    const { token } = req.params
    const { password, confirmPassword} = req.body

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()}
    })

    if(!user) {
        return next(new ErrorHandler('Password reset token is invalid or has been expired', 400))
    }

    if(password !== confirmPassword) {
        return next(new ErrorHandler('Password does not match', 400))
    }

    //b. Setup new password
    user.password = password

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save()

    sendToken(user, 200, res)
})

//GET CURRENTLY LOGGED IN USER => /api/v1/me
exports.getUserProfile = catchAsyncErrors (async (req, res, next) => {
    const user = await User.findById(req.user.id)
    res.status(200).json({
        success: true,
        user
    })
})

//UPDATE/CHANGE PASSWORD => /api/v1/password/update
exports.updatePassword = catchAsyncErrors (async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check previous user password
    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched) {
        return next(new ErrorHandler('Old password is incorrect'));
    }

    user.password = req.body.password;
    await user.save();

    sendToken(user, 200, res)
})

//UPDATE USER PROFILE => /api/v1/me/update
exports.updateProfile = catchAsyncErrors (async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    //Update avatar: TO DO
    if(req.body.avatar !== '') {
        const user = await User.findById(req.user.id)
        const image_id = user.avatar.public_id
        const res =  await cloudinary.v2.uploader.destroy

        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: 'scale'
        })
        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }

    const user = await User.findByIdAndUpdate(
        req.user.id, 
        newUserData, 
        { 
            new: true, 
            runValidators: true, 
            useFindAndModify: false
        })

    res.status(200).json({
        success: true,
        user
    })
})


//LOGOUT USER => /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', null, 
    { 
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: 'Logged out'
    })
})

//----ADMIN ROUTES----

//GET ALL USERS => /api/v1/admin/users
exports.allUsers = catchAsyncErrors (async (req, res, next) => {
    const users = await User.find()

    res.status(200).json({
        success: true,
        users
    })
})

//GET USER DETAILS => /api/v1/admin/user/:id
exports.getUserDetails = catchAsyncErrors (async (req, res, next) => {
    const user = await User.findById(req.params.id)

    if(!user) {
        return next(new ErrorHandler(`User does not founded with id: ${req.params.id}`, 400))

    }

    res.status(200).json({
        success: true,
        user
    })
})

//UPDATE USER PROFILE BY ADMIN => /api/v1/admin/user/:id
exports.updateUser = catchAsyncErrors (async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(
        req.params.id, 
        newUserData, 
        { 
            new: true, 
            runValidators: true, 
            useFindAndModify: false
        })
        
    if(!user) {
        return next(new ErrorHandler(`User does not founded with id: ${req.params.id}`, 400))

    }

    res.status(200).json({
        success: true,
        user
    })
})

//DELETE USER PROFILE BY ADMIN => /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors (async (req, res, next) => {

    const user = await User.findByIdAndRemove(req.params.id)

    if(!user) {
        return next(new ErrorHandler(`User does not founded with id: ${req.params.id}`, 400))

    }

    //Remove avatar from cloudinary - TODO

    res.status(200).json({
        success: true,
        user
    })
})