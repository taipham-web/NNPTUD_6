const bcrypt = require("bcrypt");
const { pool } = require("../config/mysql");

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    status: Boolean(row.status),
    roleId: row.role_id,
    loginCount: row.login_count,
    tokenVersion: row.token_version,
    lockTime: row.lock_time,
    isDeleted: Boolean(row.is_deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  CreateAnUser: async function (
    username,
    password,
    email,
    role = 1,
    fullname = "",
    avatar = "",
    status = false,
    logincount = 0,
  ) {
    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const [result] = await pool.execute(
      `INSERT INTO users (username, password, email, role_id, full_name, avatar_url, status, login_count)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        hashedPassword,
        email,
        role,
        fullname,
        avatar,
        status ? 1 : 0,
        logincount || 0,
      ],
    );
    return await this.FindById(result.insertId);
  },

  FindById: async function (id) {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE id = ? AND is_deleted = 0 LIMIT 1`,
      [id],
    );
    return mapUser(rows[0]);
  },

  FindByUsername: async function (username) {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE username = ? AND is_deleted = 0 LIMIT 1`,
      [username],
    );
    return mapUser(rows[0]);
  },

  GetAllUsers: async function () {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE is_deleted = 0 ORDER BY id DESC`,
    );
    return rows.map(mapUser);
  },

  UpdateById: async function (id, payload) {
    const updates = [];
    const values = [];

    if (payload.username !== undefined) {
      updates.push("username = ?");
      values.push(payload.username);
    }
    if (payload.email !== undefined) {
      updates.push("email = ?");
      values.push(payload.email);
    }
    if (payload.fullName !== undefined) {
      updates.push("full_name = ?");
      values.push(payload.fullName);
    }
    if (payload.avatarUrl !== undefined) {
      updates.push("avatar_url = ?");
      values.push(payload.avatarUrl);
    }
    if (payload.status !== undefined) {
      updates.push("status = ?");
      values.push(payload.status ? 1 : 0);
    }
    if (payload.roleId !== undefined) {
      updates.push("role_id = ?");
      values.push(payload.roleId);
    }
    if (payload.password !== undefined) {
      const hashedPassword = bcrypt.hashSync(
        payload.password,
        bcrypt.genSaltSync(10),
      );
      updates.push("password = ?");
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return await this.FindById(id);
    }

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ? AND is_deleted = 0`,
      values,
    );
    return await this.FindById(id);
  },

  SoftDeleteById: async function (id) {
    await pool.execute(
      `UPDATE users SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
      [id],
    );
    const [rows] = await pool.execute(`SELECT ROW_COUNT() AS affectedRows`);
    return rows[0].affectedRows > 0;
  },

  FailLogin: async function (user) {
    let nextLoginCount = (user.loginCount || 0) + 1;
    let lockTime = null;
    if (nextLoginCount >= 3) {
      nextLoginCount = 0;
      lockTime = new Date(Date.now() + 60 * 60 * 1000);
    }
    await pool.execute(
      `UPDATE users SET login_count = ?, lock_time = ? WHERE id = ?`,
      [nextLoginCount, lockTime, user.id],
    );
  },

  SuccessLogin: async function (user) {
    await pool.execute(
      `UPDATE users SET login_count = 0, lock_time = NULL WHERE id = ?`,
      [user.id],
    );
  },

  ChangePassword: async function (userId, oldpassword, newpassword) {
    const user = await this.FindById(userId);
    if (!user) {
      return { success: false, code: "USER_NOT_FOUND" };
    }

    const isOldPasswordCorrect = bcrypt.compareSync(oldpassword, user.password);
    if (!isOldPasswordCorrect) {
      return { success: false, code: "OLD_PASSWORD_INCORRECT" };
    }

    const newHashedPassword = bcrypt.hashSync(
      newpassword,
      bcrypt.genSaltSync(10),
    );
    await pool.execute(
      `UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?`,
      [newHashedPassword, user.id],
    );

    return { success: true };
  },
};
