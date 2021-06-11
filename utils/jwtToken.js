//CREATE AND SEND TOKEN AND SAVE IN THE COOKIE
const sendToken = (user, statusCode, res) => {

    //a. Create Jwt token
    const token = user.getJwtToken()

    //b. Options for cookie
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user
    })
}

module.exports = sendToken