var express = require("express");
var router = express.Router();

let {
  userCreateValidator,
  userUpdateValidator,
  handleResultValidator,
} = require("../utils/validatorHandler");

let userController = require("../controllers/users");

router.get("/", async function (req, res, next) {
  try {
    let users = await userController.GetAllUsers();
    res.send(users);
  } catch (error) {
    res.status(500).send({ message: "khong lay duoc danh sach users" });
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userController.FindById(req.params.id);
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post(
  "/",
  userCreateValidator,
  handleResultValidator,
  async function (req, res, next) {
    try {
      let newItem = userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        req.body.role,
        req.body.fullName,
        req.body.avatarUrl,
        req.body.status,
        req.body.loginCount,
      );
      let saved = await newItem;
      res.send(saved);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },
);

router.put(
  "/:id",
  userUpdateValidator,
  handleResultValidator,
  async function (req, res, next) {
    try {
      let updatedItem = await userController.UpdateById(req.params.id, {
        username: req.body.username,
        email: req.body.email,
        fullName: req.body.fullName,
        avatarUrl: req.body.avatarUrl,
        status: req.body.status,
        roleId: req.body.roleId,
        password: req.body.password,
      });

      if (!updatedItem)
        return res.status(404).send({ message: "id not found" });
      res.send(updatedItem);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },
);

router.delete("/:id", async function (req, res, next) {
  try {
    let deleted = await userController.SoftDeleteById(req.params.id);
    if (!deleted) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send({ message: "deleted" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
