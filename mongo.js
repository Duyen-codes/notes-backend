const mongoose = require("mongoose");

if (process.argv.length < 3) {
  console.log(
    "Please provide the password as an argument: node mongo.js <password>"
  );
  process.exit(1);
}

const password = process.argv[2];
const content = process.argv[3];
const important = process.argv[4];

// ProjectName: noteProject
// change the name of database to noteApp instead of default database test
const url = `mongodb+srv://fullstack:${password}@cluster0.hhxjjuj.mongodb.net/noteApp?retryWrites=true&w=majority`;

mongoose
  .connect(url)
  .then((result) => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB: ", error.message);
  });

// define schema for a note and the matching model

const noteSchema = new mongoose.Schema({
  content: String,
  date: Date,
  important: Boolean,
});

const Note = mongoose.model("Note", noteSchema);

if (process.argv.length === 3) {
  mongoose.connect(url).then(() => {
    Note.find({}).then((result) => {
      result.forEach((note) => console.log(note.content, note.important));
      mongoose.connection.close();
    });
  });
} else {
  mongoose.connect(url).then(() => {
    const note = new Note({
      content: content,
      date: new Date(),
      important: important,
    });
    note.save().then(() => {
      console.log(`note saved ${note.content} ${note.important} to noteApp`);
      return mongoose.connection.close();
    });
  });
}

// mongoose
//   .connect(url)
//   .then((result) => {
//     console.log("connected");
//     const note = new Note({
//       content: "HTML is Easy",
//       date: new Date(),
//       important: true,
//     });

//     return note.save();
//   })
//   .then(() => {
//     console.log("note saved!");
//     return mongoose.connection.close();
//   })
//   .catch((err) => console.log(err));
