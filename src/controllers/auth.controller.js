/*
   controller Name : Auth
*/

/** ******************  Import httpStatus and catchAsync(from utils) ******************************************************** */
const httpStatus = require("http-status");
const config = require("../config");
const catchAsync = require("../utils/catchAsync");
/** *****************  Import Services required for Auth api ******************************************************** */
const {
  authService,
  userService,
  tokenService,
  emailService,
} = require("../services");

const User = require("../models/user.model");

// Register function is used to register the new user
const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body, req);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

// Login function is used to logIn the registered user
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

// Logout is to logout the logged user
const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

// RefreshTokens is to create the auth token if token expires
const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

// forgot password is used to change the password with resetPasswordTokens
const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(
    req.body.email
  );
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

// resetPassword with resetPasswordToken
const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const googleAuth = catchAsync(async (req, res) => {
  try {
    console.log(req.ipInfo, req.user);
    if (req.user.id !== "error") {
      const userEmail = req.user.email || req.user.newUser.email;
      const userId = req.user._id || req.user.newUser._id;
      const logBodyData = {
        action: "login",
        userId: userId,
        collectionName: "users",
        data: {
          email: userEmail,
          ip: req.ipInfo,
        },
      };
      logsService.createlogs(logBodyData);
      // if an unrecongnized user try to login it go to unauthorized page
      if (req.user.edit === true) {
        // if an new user added

        const { newUser, edit } = req.user;
        Date.prototype.addMinutes = function (minutes) {
          this.setMinutes(this.getMinutes() + minutes);
          return this;
        };
        await User.update(
          { _id: newUser._id },
          { isLoggedIn: true, lastSeen: Date.now() }
        ).then(() => {
          cron.schedule("*/15 * * * *", async () => {
            let nonActiveId = [];
            await User.find({ isLoggedIn: true, isDeleted: false }).then(
              (res) => {
                res.forEach((e) => {
                  let lastSeenAfter15minutes = new Date(e.lastSeen);
                  let currentTime = new Date();
                  lastSeenAfter15minutes.addMinutes(15);
                  if (currentTime > lastSeenAfter15minutes) {
                    nonActiveId.push(e._id);
                  }
                });
              }
            );
            await User.update(
              { _id: { $in: nonActiveId } },
              { isLoggedIn: false },
              { multi: true }
            );
            // console.log("running every minute 3 seconds", data);
          });
        });
        await emailService.newContacts(
          "pingya@pacificmedicalgroup.org",
          newUser
        );
        const tokens = await tokenService.generateAuthTokens(newUser);
        res.redirect(
          `${config.url}/google/auth?refresh=${tokens.refresh.token}&userId=${newUser._id}&edit=${edit}`
        );
      } else {
        // successfull login user
        const { user } = req;
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
            await User.find({ isLoggedIn: true, isDeleted: false }).then(
              (res) => {
                res.forEach((e) => {
                  let lastSeenAfter15minutes = new Date(e.lastSeen);
                  let currentTime = new Date();
                  lastSeenAfter15minutes.addMinutes(15);
                  if (currentTime > lastSeenAfter15minutes) {
                    nonActiveId.push(e._id);
                  }
                });
              }
            );
            await User.update(
              { _id: { $in: nonActiveId } },
              { isLoggedIn: false },
              { multi: true }
            );
            // console.log("running every minute 3 seconds", data);
          });
        });
        const tokens = await tokenService.generateAuthTokens(user);
        // console.log(tokens,1)
        res.redirect(
          `${config.url}/google/auth?refresh=${tokens.refresh.token}&userId=${user._id}`
        );
      }
    } else {
      res.redirect(`${config.url}/unauthorized?email=${req.user.email}`);
    }
    // res.redirect("http://localhost:3000")
  } catch (e) {
    console.log(e);
  }
  // const tokens =  await tokenService.generateAuthTokens(user);
  // res.send({user, tokens });
  // res.status(httpStatus.NO_CONTENT).send();
});

// export all the controller to use in routes
module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  googleAuth,
};
