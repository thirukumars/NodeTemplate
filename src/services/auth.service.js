/*
   Service Name : Auth
*/

/** ***************** Models Import ******************************************************** */
const httpStatus = require("http-status");

/** ***************** Import token and user service  from service ******************************************************** */
const tokenService = require("./token.service");
const userService = require("./user.service");

/** ***************** Import Token model from model ******************************************************** */
const Token = require("../models/token.model");
const User = require("../models/user.model");

/** ***************** ApiError from utils ******************************************************** */

const ApiError = require("../utils/ApiError");

/** ***************** tokenTypes from config/tokens ******************************************************** */

const { tokenTypes } = require("../config/tokens");
const logsService = require("./logs.service");
let cron = require("node-cron");

/**
 * Login with corematicaName and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  console.log(user._id);

  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  const logBodyData = {
    action: "login",
    userId: "",
    collectionName: "users",
    data: {
      email: email,
      password: password,
    },
  };
  await logsService.createlogs(logBodyData);
  Date.prototype.addMinutes = function (minutes) {
    this.setMinutes(this.getMinutes() + minutes);
    return this;
  };
  await User.update(
    { _id: user._id },
    { isLoggedIn: true, lastSeen: Date.now() }
  ).then(() => {
    cron.schedule("*/15 * * * *", async () => {
      let nonActiveId = [];
      await User.find({ isLoggedIn: true, isDeleted: false }).then((res) => {
        console.log(res);
        res.forEach((e) => {
          let lastSeenAfter15minutes = new Date(e.lastSeen);
          let currentTime = new Date();
          lastSeenAfter15minutes.addMinutes(15);
          console.log(
            currentTime,
            lastSeenAfter15minutes,
            currentTime > lastSeenAfter15minutes
          );
          if (currentTime > lastSeenAfter15minutes) {
            nonActiveId.push(e._id);
          }
        });
      });
      await User.update(
        { _id: { $in: nonActiveId } },
        { isLoggedIn: false },
        { multi: true }
      );
      // console.log("running every minute 3 seconds", data);
    });
  });

  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  console.log(refreshToken);
  const logBodyData = {
    action: "logout",
    userId: "",
    collectionName: "users",
    data: "",
  };
  await logsService.createlogs(logBodyData);
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Not found");
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH
    );
    const user = await User.findById(refreshTokenDoc.user);

    if (!user) {
      throw new Error(user);
    }
    const logBodyData = {
      action: "refresh",
      userId: "",
      collectionName: "users",
      data: user,
    };
    await logsService.createlogs(logBodyData);
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(
      resetPasswordToken,
      tokenTypes.RESET_PASSWORD
    );
    const user = await User.findById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
    await userService.updateUserById(user.id, { password: newPassword });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
};
