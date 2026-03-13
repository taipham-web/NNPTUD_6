const { VerifyAccessToken } = require("./GenToken");
const userController = require("../controllers/users");

module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).send({ message: "bạn chưa đăng nhập" });
  }

  try {
    const decoded = VerifyAccessToken(token);
    const user = await userController.FindById(decoded.sub);
    if (!user) {
      return res.status(401).send({ message: "token khong hop le" });
    }

    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).send({ message: "token da het hieu luc" });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).send({ message: "token khong hop le" });
  }
};
