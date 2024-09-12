const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;

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
});

// 비밀번호 암호화
userSchema.pre('save', function(next) {
    var user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(saltRounds, function(err, salt) {
            if (err) return next(err);
            
            bcrypt.hash(user.password, salt, function(err, hash) {
                if (err) return next(err);
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

// 비밀번호 비교
userSchema.methods.comparePassword = function(plainPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainPassword, this.password, function(err, isMatch) {
            if (err) return reject(err);
            resolve(isMatch);
        });
    });
};

// 토큰 생성
userSchema.methods.generateToken = async function() {
    var user = this;
    var token = jwt.sign(user._id.toHexString(), process.env.JWT_SECRET); // 비밀 키를 환경 변수로

    user.token = token;
    await user.save();
    return user;
};

// findByToken 메서드 비동기 처리
userSchema.statics.findByToken = async function(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await this.findOne({ "_id": decoded, "token": token });

    if (!user) {
        throw new Error('유효하지 않은 토큰');
    }

    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
