/*
   Service Name : Users
*/

/** ***************** Models Import ******************************************************** */
const httpStatus = require("http-status");
const logger = require("../config/logger");
const { User, Favourite } = require("../models");

/** ***************** package Import ******************************************************** */

/** ***************** ApiError Import ******************************************************** */
const ApiError = require("../utils/ApiError");

/** ***************** Counter services Import ******************************************************** */
const counter = require("./counter.service");
const logsService = require("./logs.service");
const updateLogsService = require("./updateLogger.service");
const emailService = require("./email.service");
// const jsonFile = require("../../convertedData-15-03-21.json");

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBodyData, req) => {
  const userBody = userBodyData;
  const userName = userBody.userName;

  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  console.log(userBody, 1);

  let duplicateBody = { ...userBody };
  let requiredData = { isDeleted: false };
  Object.keys(duplicateBody).map((key, index) => {
    if (
      key === "email" ||
      key === "lastName" ||
      key === "firstName" ||
      key === "mobileNumber"
    ) {
      requiredData[key] = duplicateBody[key];
    }
  });
  console.log(duplicateBody, 2, requiredData);
  const indenticalCheck = await User.find(requiredData);
  console.log(!indenticalCheck, !indenticalCheck.length, indenticalCheck);
  if (!indenticalCheck || !indenticalCheck.length) {
    // let checkFirstName;
    // let checkLastName;
    // let checkEmail;
    // let checkMobileNumber;
    // let checkPager;
    // if (userBody.email) {
    //   email = await User.exists({
    //     email: userBody.email,
    //   });
    // }
    // if (userBody.firstName) {
    //   first = await User.exists({
    //     firstName: userBody.firstName,
    //   });
    // }
    // if (userBody.lastName) {
    //   last = await User.exists({
    //     lastName: userBody.lastName,
    //   });
    // }

    // console.log(checkFirstName, checkLastName, checkEmail);

    // if (userBody.corematicaName) {
    //   const check = await User.exists({
    //     corematicaName: userBody.corematicaName,
    //   });
    // if (check)
    //   throw new ApiError(httpStatus.BAD_REQUEST, "corematicaName already taken");

    // if (!email) {
    //   if (!first || !last) {
    const id = await counter.getCount("users"); // passing users id to get counter value to autoIncrement _id

    userBody._id = id.toString();
    userBody.createdBy = userBody._id;
    try {
      // const passwordValue =
      //   "$2a$08$DP6EhTkCdpMNq8Maf9TZGumZU1YBpgzJDFd5fE9.Xn2od8296bs/O";
      // let i = 0;
      // jsonFile.table_contacts.forEach(async (data) => {
      //   console.log(i);
      //   i = i + 1;
      //   // let emailValue = data.lastName+data.firstName+"@pacificmedicalgroup.org";
      //   let DummyBody = {
      //     _id: i,
      //     firstName: data.firstName,
      //     lastName: data.lastName,
      //     email: data.email ? data.email : null,
      //     // password: passwordValue,
      //     title: data.title,
      //     specialty: data.specialty ? data.specialty : "",
      //     role: data.role ? data.role : "user",
      //     location: data.location ? data.location : "",
      //     mobileNumber: data.mobileNumber ? data.mobileNumber : "",
      //     officePhone: data.officePhone ? data.officePhone : "",
      //     pager: data.pager ? data.pager : "",
      //     notes: data.notes ? data.notes : "",
      //     pcp: data.pcp ? data.pcp : "",
      //     isAdmin: data.isAdmin ? data.isAdmin : "",
      //     isActive: data.isActive,
      //     isDeleted: data.isDeleted,
      //     isApproved : "approved"
      //   };

      //   if (DummyBody.pcp === "") delete DummyBody.pcp;
      //   if (DummyBody.email === null) delete DummyBody.email;
      //   if (DummyBody.firstName === "") delete DummyBody.firstName;
      //   if (DummyBody.lastName === "") delete DummyBody.lastName;
      //   if (
      //     DummyBody.firstName === "Aravind" ||
      //     DummyBody.firstName === "Mathew"
      //   ) {
      //     DummyBody.password = passwordValue;
      //   }
      //   if (DummyBody.title === "") delete DummyBody.title;
      //   if (DummyBody.specialty === null) delete DummyBody.specialty;
      //   if (DummyBody.role === null) delete DummyBody.role;
      //   if (DummyBody.location === "") delete DummyBody.location;
      //   if (DummyBody.mobileNumber === "") delete DummyBody.mobileNumber;
      //   if (DummyBody.officePhone === "") delete DummyBody.officePhone;
      //   if (DummyBody.pager === "") delete DummyBody.pager;
      //   if (DummyBody.notes === "") delete DummyBody.notes;
      //   if (DummyBody.isActive === null) delete DummyBody.isActive;
      //   if (DummyBody.isDeleted === null) delete DummyBody.isDeleted;
      //   if (DummyBody.isAdmin === "") delete DummyBody.isAdmin;
      //   // await User.updateMany(
      //   //   {},
      //   //   { $set: { isApproved: "approved" }, multi: true }
      //   // );
      //   // return "success";
      //   await User.create(DummyBody);
      // });
      const user = await User.create(userBody).catch((e) => {
        if (e.code === 11000) {
          logger.error(`${JSON.stringify(e.keyValue)} duplicate error`);
          const duplicates = Object.keys(e.keyValue);
          throw new Error(`${duplicates} duplicates details`);
        }
      });

      const logBodyData = {
        action: "create",
        userId: userBody._id,
        collectionName: "users",
        data: userBody,
      };
      logsService.createlogs(logBodyData);
      if (user) {
        emailService.createContacts(
          "pingya@pacificmedicalgroup.org",
          userBodyData,
          req.user || userBody.email
        );
        return user;
      }
    } catch (e) {
      if (e.toString().includes("duplicates"))
        throw new ApiError(httpStatus.CONFLICT, e);
      else throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, e);
    }
    //   } else if (first)
    //     throw new ApiError(httpStatus.CONFLICT, "firstName already taken");
    //   else if (last)
    //     throw new ApiError(httpStatus.CONFLICT, " lastName already taken");
    // } else throw new ApiError(httpStatus.CONFLICT, " email already taken");
  } else {
    return { code: 200, message: "identical contact" };
  }
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
const queryUsers = async (filterData, options, req) => {
  const filter = filterData;
  const logBodyData = {
    action: "get",
    userId: req.user._id,
    collectionName: "users",
    data: filter,
  };
  logsService.createlogs(logBodyData);
  // const sort = "";
  // if (filter.userName)
  //   filter.userName = {
  //     $regex: escapeRegExp(filter.userName),
  //     $options: "i",
  //   };
  if (req.query.search) {
    filter.$or = [
      {
        firstName: {
          $regex: `${escapeRegExp(req.query.search)}`,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: `${escapeRegExp(req.query.search)}`,
          $options: "i",
        },
      },
    ];
  }

  // if (options.sortBy) {
  //   if (options.sortBy) {
  //     const sortingCriteria = [];
  //     options.sortBy.split(",").forEach((sortOption) => {
  //       const [key, order] = sortOption.split(":");
  //       sortingCriteria.push((order === "desc" ? "-" : "") + key);
  //     });
  //     sort = sortingCriteria.join(" ");
  //   } else {
  //     sort = { createdAt: -1 };
  //   }
  // }
  filter.isDeleted = false;
  console.log(filter);
  try {
    const users = await User.paginate(filter, options, {
      createdBy: 0,
      updatedBy: 0,
      isDeleted: 0,
    }); // This third argument is to remove the field from response
    // const users = await User.find(filter)
    // .collation({ locale: "en" })
    // .sort(sort);

    return users;
  } catch (e) {
    logger.error(e);
  }
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  try {
    const logBodyData = {
      action: "get",
      userId: id,
      collectionName: "users",
      data: { _id: id },
    };
    await logsService.createlogs(logBodyData);
    return User.find({ _id: id, isDeleted: false }, { isDeleted: 0 });
  } catch (e) {
    logger.error(e);
  }
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email, isDeleted: false });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBodyData, req) => {
  const updateBody = updateBodyData;
  try {
    const user = await User.findById(userId);
    let cpyUser;
    let cpyUpdateBody;
    if (user) cpyUser = { ...user._doc };
    if (updateBodyData) cpyUpdateBody = { ...updateBodyData };
    emailService.updateContacts(
      "pingya@pacificmedicalgroup.org",
      cpyUpdateBody,
      cpyUser,
      req.user
    );
    const logBodyData = {
      action: "update",
      userId: user._id,
      collectionName: "users",
      data: updateBody,
    };
    logsService.createlogs(logBodyData);
    const updateLogBodyData = {
      action: "update",
      userId: user._id,
      collectionName: "users",
      oldData: user,
      data: updateBody,
    };
    updateLogsService.createlogs(updateLogBodyData);

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    if (
      updateBody.email &&
      (await User.isEmailTaken(updateBody.email, userId))
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
    }
    updateBody.updatedBy = userId;
    Object.assign(user, updateBody);
    return await user
      .save()
      .then((res) => {
        console.log(res);
        return res;
      })
      .catch((e) => {
        if (e.code === 11000) {
          logger.error(`${JSON.stringify(e.keyValue)} duplicate error`);
          const duplicates = Object.keys(e.keyValue);
          throw new Error(`${duplicates} duplicates details`);
        } else {
          throw new Error(e);
        }
      });
  } catch (e) {
    if (e.toString().includes("duplicates"))
      throw new ApiError(httpStatus.CONFLICT, e);
    else throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, e);
  }
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId, userDetails) => {
  const user = await User.findById(userId);
  emailService.deleteContacts(
    "pingya@pacificmedicalgroup.org",
    user,
    userDetails
  );
  const logBodyData = {
    action: "delete",
    userId,
    collectionName: "users",
    data: userId,
  };
  await logsService.createlogs(logBodyData);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  // await user.remove();
  let favId = [];
  await Favourite.find({ favouriteId: userId }).then(async (res) => {
    let dumId = [];
    console.log(res);
    res.forEach((data) => {
      favId.push(data._id);
    });
    await Favourite.update(
      { _id: { $in: favId } },
      { $set: { isDeleted: true } },
      { multi: true }
    );
  });
  user.isDeleted = true;
  await user.save();
  return user;
};

const activeUsers = async (filterData, options, req) => {
  const filter = filterData;
  filter.isDeleted = false;
  console.log(filter);

  try {
    // const users = await User.paginate(filter, options, {
    //   createdBy: 0,
    //   updatedBy: 0,
    //   isDeleted: 0,
    // });
    let updatedDate = new Date();
    await User.update(
      { _id: req.user._id },
      { lastSeen: updatedDate, isLoggedIn: true }
    );
    return {
      status: "date updated successfully",
    };
  } catch (e) {
    logger.error(e);
  }
};

// exporting all the methods
module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  activeUsers,
};
