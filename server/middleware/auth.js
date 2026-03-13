const { User } = require('../models/User');

let auth = async (req, res, next) => {
    // 인증 처리
    try {
        // 클라이언트 쿠키에서 토큰을 가져온다
        let token = req.cookies.x_auth;

        // 토큰을 복호화 한후 유저를 찾는다
        const user = await User.findByToken(token);

        // 유저가 없으면 인증 실패
        if (!user) return res.json({ isAuth: false, error: true });

        // 유저가 있으면 req에 정보를 넣어주고 다음으로
        req.token = token;
        req.user = user;
        next();

    } catch (err) {
        return res.status(400).send(err);
    }
}

module.exports = { auth };