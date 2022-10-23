const supertest = require("supertest");
const mongoose = require("mongoose");
const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);
const Note = require("../models/note");
const User = require("../models/user");
const bcrypt = require("bcrypt");

beforeEach(async () => {
  await Note.deleteMany({});
  await Note.insertMany(helper.initialNotes);
});

describe("when there is initially some notes saved", () => {
  test("notes are returned as json", async () => {
    await api
      .get("/api/notes")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  }, 100000);

  test("all notes are returned", async () => {
    const response = await api.get("/api/notes");
    expect(response.body).toHaveLength(helper.initialNotes.length);
  });

  test("a specific note is within the returned notes", async () => {
    const response = await api.get("/api/notes");
    const contents = response.body.map((r) => r.content);
    expect(contents).toContain("Browser can execute only Javascript");
  });
});

describe("viewing a specific note", () => {
  test("succeeds with a valid id", async () => {
    const notesAtStart = await helper.notesInDb();
    const noteToView = notesAtStart[0];
    console.log("noteToView", noteToView);
    const resultNote = await api.get(`/api/notes/${noteToView.id}`);
    console.log("resultNote body", resultNote.body);
    const stringifiedNote = JSON.stringify(noteToView);
    console.log("stringifiedNote", stringifiedNote);
    const parsedNote = JSON.parse(stringifiedNote);
    console.log("parsedNote", parsedNote);
    const processedNoteToView = JSON.parse(JSON.stringify(noteToView));
    expect(resultNote.body).toEqual(processedNoteToView);
  });

  test("fails with statuscode 404 if note does not exist", async () => {
    const validNoneExistingId = await helper.nonExistingId();
    console.log("validNoneExistingId", validNoneExistingId);
    await api.get(`/api/blogs/${validNoneExistingId}`).expect(404);
  });
});

// test adding a new note and verifies the amount of notes returned by the API increases

describe("addition of a new note", () => {
  // add user before each test
  beforeEach(async () => {
    await User.deleteMany({});
    const passwordHash = await bcrypt.hash("test", 10);
    const user = new User({ username: "test", name: "test", passwordHash });
    await user.save();
  });

  test("succeeds with valid data", async () => {
    // login user
    const response = await api
      .post("/api/login")
      .send({ username: "test", password: "test" });

    const token = response.body.token;
    console.log("response.body", response.body);
    const newNote = {
      content: "before tests, empty user db, add new user, login user",
      important: true,
    };

    await api
      .post("/api/notes")
      .send(newNote)
      .set({ authorization: `bearer ${token}` })
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const notesAtEnd = await helper.notesInDb();
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length + 1);
    const contents = notesAtEnd.map((n) => n.content);
    expect(contents).toContain(
      "before tests, empty user db, add new user, login user"
    );
  });

  test.only("fails with status code 400 if data is invalid", async () => {
    // login user
    const response = await api
      .post("/api/login")
      .send({ username: "test", password: "test" });

    const token = response.body.token;

    // post note
    const newNote = {
      important: true,
    };

    await api
      .post("/api/notes")
      .send(newNote)
      .set({ authorization: `bearer ${token}` })
      .expect(400);

    const notesAtEnd = await helper.notesInDb();
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length);
  });
});

describe("deletion of a note", () => {
  test("a note can be deleted", async () => {
    const notesAtStart = await helper.notesInDb();
    const noteToDelete = notesAtStart[0];

    await api.delete(`/api/notes/${noteToDelete.id}`).expect(204);

    const notesAtEnd = await helper.notesInDb();
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length - 1);

    const contents = notesAtEnd.map((r) => r.contents);
    expect(contents).not.toContain(noteToDelete.content);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
