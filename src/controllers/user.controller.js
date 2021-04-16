/*
   controller Name : User
*/

/** ******************  Import httpStatus ******************************************************** */

const httpStatus = require("http-status");
/** ******************  Import pick,ApiError and catchAsync ******************************************************** */
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/** ******************  Import Services ******************************************************** */
const { userService } = require("../services");

/*
function createUser  -  This function is used to create an user  
*/
const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body, req); // send to createUser request before create

  res.status(httpStatus.CREATED).send(user);
});

/*
function getUser  -  This function is used to get an user  based on specifie corematicaName and role
*/

const getUsers = catchAsync(async (req, res) => {
  // console.log(req.query)
  const filter = pick(req.query, [
    "userName",
    "role",
    "mobileNumber",
    "specialty",
    "pager",
    "fax",
    "officePhone",
    "pcp",
    "isLoggedIn",
  ]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await userService.queryUsers(filter, options, req);
  res.send(result);
});

/*
function getUser  -  This function is used to get an user  based on id
*/
const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.send(user);
});

/*
function updateUser  -  This function is used to update an user  based on id
*/

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(
    req.params.userId,
    req.body,
    req
  );
  res.send(user);
});

/*
function deleteUser  -  This function is used to delete an user  based on id
*/
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId, req.user);
  res.status(200).send({ success: true });
});

const activeStatus = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["_id", "isLoggedIn"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await userService.activeUsers(filter, options, req);
  res.send(result);
});
/*
exporting all the function using module exports
*/
module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  activeStatus,
};
