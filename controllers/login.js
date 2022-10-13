const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginRouter = require("express").Router();
const User = require("../models/user");

loginRouter.post("/", async (request, response) => {
  const { username, password } = request.body;

  // search for the user from the database by the username attached to the request
  const user = await User.findOne({ username });

  // check the password attached to the request, bcrypt.compare method is used to check if the password is correct
  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash);

  // if user is not found or password is incorrect, the request is responded to with the status code 401 unauthorized 
  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: "invalid username or password",
    });
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  };
  console.log("userForToken", userForToken);

  // token expires in 60*60 seconds, that is, in one hour
  const token = jwt.sign(userForToken, process.env.SECRET, {
    expiresIn: 60 * 60,
  });
  console.log("token", token);

  // a successful request is responded to with the status code 200 OK. The generated token, username and name of the user are sent back in the response body
  response
    .status(200)
    .send({ token, username: user.username, name: user.name });
});

module.exports = loginRouter;
