var express = require("express");
var router = express.Router();
let userController = require("../controllers/users");
let {
  RegisterValidator,
  ChangePasswordValidator,
  handleResultValidator,
} = require("../utils/validatorHandler");
let bcrypt = require("bcrypt");
let { CreateAccessToken } = require("../utils/GenToken");
let authMiddleware = require("../utils/authMiddleware");
/* GET home page. */
router.post(
  "/register",
  RegisterValidator,
  handleResultValidator,
  async function (req, res, next) {
    try {
      let newUser = userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        1,
      );
      await newUser;
      return res.send({
        message: "dang ki thanh cong",
      });
    } catch (error) {
      if (error && (error.code === 11000 || error.code === "ER_DUP_ENTRY")) {
        return res.status(409).send("username hoac email da ton tai");
      }
      return res.status(500).send("dang ki that bai");
    }
  },
);
router.post("/login", async function (req, res, next) {
  try {
    let { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send("thieu username hoac password");
    }

    let getUser = await userController.FindByUsername(username);
    if (!getUser) {
      return res.status(403).send("tai khoan khong ton tai");
    } else {
      if (getUser.lockTime && getUser.lockTime > Date.now()) {
        return res.status(403).send("tai khoan dang bi ban");
      }
      if (bcrypt.compareSync(password, getUser.password)) {
        await userController.SuccessLogin(getUser);
        const accessToken = CreateAccessToken(getUser);
        return res.send({
          userId: getUser.id,
          accessToken,
        });
      } else {
        await userController.FailLogin(getUser);
        return res.status(403).send("thong tin dang nhap khong dung");
      }
    }
  } catch (error) {
    return res.status(500).send("dang nhap that bai");
  }
});

router.get("/me", authMiddleware, async function (req, res) {
  try {
    const user = await userController.FindById(req.user.sub);
    if (!user) {
      return res.status(404).send({ message: "khong tim thay user" });
    }

    return res.send({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        url_image: user.avatarUrl,
        loginCount: user.loginCount,
        roleId: user.roleId,
      },
    });
  } catch (error) {
    return res.status(500).send({ message: "khong lay duoc thong tin user" });
  }
});

router.post(
  "/change-password",
  authMiddleware,
  ChangePasswordValidator,
  handleResultValidator,
  async function (req, res) {
    try {
      const result = await userController.ChangePassword(
        req.user.sub,
        req.body.oldpassword,
        req.body.newpassword,
      );

      if (!result.success) {
        if (result.code === "USER_NOT_FOUND") {
          return res.status(404).send({ message: "khong tim thay user" });
        }
        if (result.code === "OLD_PASSWORD_INCORRECT") {
          return res.status(400).send({ message: "oldpassword khong dung" });
        }
      }

      return res.send({
        message: "doi mat khau thanh cong, vui long dang nhap lai",
      });
    } catch (error) {
      return res.status(500).send({ message: "doi mat khau that bai" });
    }
  },
);

module.exports = router;
