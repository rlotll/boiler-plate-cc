const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config/key');
const { User } = require("./models/User");
const { auth } = require('./middleware/auth');

//application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
//application/json
app.use(express.json());
app.use(cookieParser());

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// 회원가입 라우터

app.post('/api/users/register', async (req, res) => {
  //회원가입시 필요한 정보들을 client에서 가져오면 DB에 넣어준다.
  const user = new User(req.body)

  try {
    const userInfo = await user.save()
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.json({ success: false, err })
  }
})

// 로그인 라우터

app.post('/api/users/login', async (req, res) => {
  try {
    // 1. 요청된 이메일을 DB에서 찾는다.
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "제공된 이메일에 해당하는 유저가 없습니다."
      });
    }

    // 2. 이메일이 있다면 비밀번호가 맞는지 확인한다.
    const isMatch = await user.comparePassword(req.body.password);

    if (!isMatch) {
      return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다." });
    }

    // 3. 비밀번호가 맞다면 토큰을 생성한다.
    const tokenUser = await user.generateToken();

    // 4. 토큰을 저장한다. (쿠키 or 로컬스토리지에)
    res.cookie("x_auth", tokenUser.token)
      .status(200)
      .json({ loginSuccess: true, userId: tokenUser._id });

  } catch (err) {
    return res.status(400).send(err);
  }
});

// Auth 라우터
// role 0 -> 일반 유저  role 0 이외 -> 관리자

app.get('/api/users/auth', auth, (req, res) => {
  //여기까지 미들웨어를 통과했다는것은 Authentication이 true라는 의미
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
})

// 로그아웃 라우터

app.get('/api/users/logout', auth, async (req, res) => {
  try {
    await User.findOneAndUpdate({ _id: req.user._id }, { token: "" });

    return res.status(200).send({
      success: true
    });
  } catch {
    return res.json({ success: false, err });
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

