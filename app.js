const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/studentDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB database");
});

// Define the Student schema
const studentSchema = new mongoose.Schema({
  student_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  marks: { type: Number, required: false },
});

const Student = mongoose.model("Student", studentSchema);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Create a new student
app.post("/students", async (req, res) => {
  try {
    const { student_id, name, dob, marks } = req.body;
    const student = new Student({ student_id, name, dob, marks });
    await student.save();
    return res.status(201).json({
      message: "Student created successfully",
      status_code: 201,
      data: req.body,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: err.message,
      status_code: 500,
      data: null,
    });
  }
});

// Get all students
// app.get("/students", (req, res) => {
//   Student.find({})
//     .exec()
//     .then((students) => {
//       res.json({
//         message: "success",
//         status_code: 200,
//         data: students,
//       });
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).send("Error retrieving students");
//     });
// });

// Get all students with pagination and filtering
app.get("/students", async (req, res) => {
  try {
    const { page = 1, pageSize = 10, name = "", marks } = req.query;

    const limit = +pageSize;
    const skip = (+page - 1) * limit;
    const query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" }; // Case-insensitive matching
    }
    if (marks) {
      query.marks = { $eq: marks };
    }

    const totalStudents = await Student.countDocuments(query);
    const totalPages = Math.ceil(totalStudents / limit);

    const students = await Student.find({ ...query })
      .skip(skip)
      .limit(limit)
      .exec();

    res.json({
      data: students,
      result: students.length,
      page: parseInt(page),
      pageSize: limit,
      totalPages: totalPages,
      totalStudents: totalStudents,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving students");
  }
});

// Get a student by ID
app.get("/students/:id", (req, res) => {
  const student_id = req.params.id;
  Student.findOne({ student_id })
    .exec()
    .then((student) => {
      if (!student) {
        res.status(404).json({
          message: "Student not found",
          status_code: 404,
          data: null,
        });
      } else {
        res.json({ message: "success", status_code: 200, data: student });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving student");
    });
});

// Update a student by ID
app.put("/students/:id", async (req, res) => {
  try {
    const student_id = req.params.id;
    const { name, dob } = req.body;
    const updatedStudent = await Student.findOneAndUpdate(
      { student_id },
      { name, dob },
      { new: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({
        message: "Student not found",
        status_code: 404,
        data: null,
      });
    } else {
      return res.status(202).json({
        message: "success",
        status_code: 202,
        data: updatedStudent,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error updating student");
  }
});

// Delete a student by ID
app.delete("/students/:id", async (req, res) => {
  try {
    const student_id = req.params.id;
    const deletedStudent = await Student.findOneAndRemove({ student_id });

    if (!deletedStudent) {
      return res.status(404).json({
        message: "Student not found",
        status_code: 404,
        data: null,
      });
    } else {
      return res.status(200).json({
        message: "success",
        status_code: 200,
        data: deletedStudent,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error deleting student");
  }
});

// Start the server
app.listen(4000, () => {
  console.log("Server is running on http://localhost:4000");
});
