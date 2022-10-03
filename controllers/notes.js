const jwt = require("jsonwebtoken");
const notesRouter = require("express").Router();

const Note = require("../models/note");
const User = require("../models/user");

notesRouter.get("/", async (request, response) => {
  const notes = await Note.find({}).populate("user", { username: 1, name: 1 });
  response.json(notes);
});

notesRouter.get(":/id", (request, response, next) => {
  Note.findById(request.params.id)
    .then((note) => {
      if (note) {
        response.json(note);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.substring(7);
  }
  return null;
};

notesRouter.post("/", async (request, response, next) => {
  const body = request.body;

  const token = getTokenFrom(request);
  console.log("token", token);

  const decodedToken = jwt.verify(token, process.env.SECRET);
  console.log("decodedToken", decodedToken);

  if (!decodedToken.id) {
    return response.status(401).json({
      error: "token missing or invalid",
    });
  }

  const user = await User.findById(decodedToken.id);

  // const user = await User.findById(body.userId);

  console.log("user", user);

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
  console.log("savedNote", savedNote);
  user.notes = user.notes.concat(savedNote._id);
  await user.save();
  response.json(savedNote);
  // note
  //   .save()
  //   .then((savedNote) => {
  //     console.log("savedNote", savedNote);
  //     return response.status(201).json(savedNote);
  //   })
  //   .catch((error) => next(error));
});

notesRouter.put("/:id", (request, response, next) => {
  const { content, important } = request.body;

  const note = {
    content,
    important,
  };

  Note.findByIdAndUpdate(request.params.id, note, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((updatedNote) => {
      response.json(updatedNote);
    })
    .catch((error) => next(error));
});

notesRouter.delete("/:id", (request, response, next) => {
  Note.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

module.exports = notesRouter;
