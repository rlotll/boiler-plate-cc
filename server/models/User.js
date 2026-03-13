const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})

userSchema.pre('save', async function () {
    var user = this;

    // 비밀번호가 변경될 때만 암호화 진행
    if (user.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt(saltRounds);
            const hash = await bcrypt.hash(user.password, salt);
            user.password = hash;
        } catch (err) {
            throw err;
        }
    }
});

userSchema.methods.comparePassword = async function (plainPassword) {
    const isMatch = await bcrypt.compare(plainPassword, this.password);
    return isMatch;
}

userSchema.methods.generateToken = async function () {
    const user = this;
    //jsonwebtoken을 이용해서 token 생성
    const token = jwt.sign(user._id.toHexString(), 'secretToken')
    user.token = token;

    await user.save();
    return user;
}

userSchema.statics.findByToken = async function (token) {
    const user = this;

    try {
        const decoded = jwt.verify(token, 'secretToken');
        const foundUser = await user.findOne({ "_id": decoded, "token": token });
        return foundUser;
    } catch (err) {
        throw err;
    }
}

const User = mongoose.model('User', userSchema)

module.exports = { User }