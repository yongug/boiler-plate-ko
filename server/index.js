require('dotenv').config();

const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config/key');
const { auth } = require('./middleware/auth');
const { User } = require("./models/User");

const cors = require('cors');

// 특정 도메인만 허용
const corsOptions = {
  origin: 'http://localhost:3000', // 허용할 도메인
  optionsSuccessStatus: 200,
};

// CORS 설정 적용
app.use(cors(corsOptions));

//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

//application/json
app.use(bodyParser.json());

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err))



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api/hello', (req,res) => {
  
  res.send("안녕하세요 ~ ")
})


app.post('/register', async (req, res) => {
  // 회원 가입 시 필요한 정보들을 client에서 가져오면
  // 그것들을 데이터베이스에 넣어준다.

  const user = new User(req.body);

  try {
    await user.save(); // await를 사용하여 비동기적으로 데이터를 저장
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, err });
  }
});

app.post('/login', async (req, res) => {
  try {
    // 요청된 이메일을 db에서 찾음
    const userInfo = await User.findOne({ email: req.body.email });

    if (!userInfo) {
      return res.json({
        loginSuccess: false,
        message: "제공된 이메일에 해당하는 유저가 없습니다."
      });
    }

    // 비밀번호 비교 (Promise 사용)
    const isMatch = await userInfo.comparePassword(req.body.password);

    if (!isMatch) {
      return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다." });
    }

    // 토큰 생성
    const userWithToken = await userInfo.generateToken();

    // 토큰을 쿠키에 저장 후 응답
    res.cookie("x_auth", userWithToken.token)
      .status(200)
      .json({ loginSuccess: true, userId: userWithToken._id });

  } catch (err) {
    return res.status(400).send(err);
  }
});

// role 1  어드민     role 2 특정 부서 어드민
// role 0 -> 일반 유저  role 0이 아니면 관리자
app.get('/api/users/auth', auth , (req,res) => {
  try{
    // 여기까지 미들웨어를 통과해 왔단는 얘기는 Authentication이 True 라는 말
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image
  })
  }
  catch(err) {
    return res.status(400).json({
      success: false,
      message: '인증 정보를 불러오는 도중 문제가 발생했습니다.'
    });
  }
  
})

app.get('/api/users/logout', auth, async (req, res) => {
  try {
    if (!req.cookies.x_auth) {
      return res.status(400).json({ success: false, message: '로그아웃 요청에 유효한 토큰이 없습니다.' });
    }

    await User.findOneAndUpdate(
      { _id: req.user._id }, 
      { token: "" }
    );

    return res.status(200).send({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: '로그아웃 실패' });
  }
});





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})