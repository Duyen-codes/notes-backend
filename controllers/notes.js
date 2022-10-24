const jwt = require("jsonwebtoken");
const notesRouter = require("express").Router();

const Note = require("../models/note");
const User = require("../models/user");
const middleware = require("../utils/middleware");

notesRouter.get("/", async (request, response) => {
  const notes = await Note.find({}).populate("user", { username: 1, name: 1 });
  response.json(notes);
});

notesRouter.get("/:id", async (request, response, next) => {
  const note = await Note.findById(request.params.id);
  if (note) {
    response.json(note);
  } else {
    response.status(400).end();
  }
});

// const getTokenFrom = (request) => {
//   const authorization = request.get("authorization");
//   if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
//     return authorization.substring(7);
//   }
//   return null;
// };

notesRouter.post(
  "/",
  middleware.userExtractor,
  async (request, response, next) => {
    const body = request.body;
    const user = await request.user;
    // const token = getTokenFrom(request);
    // const decodedToken = jwt.verify(request.token, process.env.SECRET);
    // if (!decodedToken.id) {
    //   return response.status(401).json({
    //     error: "token missing or invalid",
    //   });
    // }
    // const user = await User.findById(decodedToken.id);
    // const user = await User.findById(body.userId);

    if (body.content === undefined) {
      response.status(400).json({
        error: "content missing",
      });
    }
    const note = new Note({
      content: body.content,
      important: body.important === undefined ? false : body.important,
      date: new Date(),
      user: user._id,
    });
    const savedNote = await note.save();
    user.notes = user.notes.concat(savedNote._id);
    await user.save();
    response.status(201).json(savedNote);
  }
);

notesRouter.put(
  "/:id",
  middleware.userExtractor,
  async (request, response, next) => {
    const { content, important } = request.body;
    const user = request.user;
    const userid = user._id;

    const note = await Note.findById(request.params.id);
    console.log("foundNote of backend", note);
    const newNote = {
      content,
      important,
    };

    if (note.user.toString() === userid.toString()) {
      const updatedNote = await Note.findByIdAndUpdate(
        request.params.id,
        newNote,
        {
          new: true,
          runValidators: true,
          context: "query",
        }
      );
      console.log("updatedNote from backend", updatedNote);
      response.status(200).json(updatedNote);
    }
  }
);

notesRouter.delete(
  "/:id",
  middleware.userExtractor,
  async (request, response, next) => {
    const note = await Note.findById(request.params.id);
    const user = request.user;
    console.log("user", user);
    const userid = user._id;

    if (note.user.toString() === userid.toString()) {
      await Note.findByIdAndRemove(request.params.id); // w/o await here caused error Internal 500 error during test
      response.status(204).end();
    }
  }
);

module.exports = notesRouter;
