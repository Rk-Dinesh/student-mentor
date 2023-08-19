const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv')
const bodyParser = require('body-parser');
dotenv.config()
const app = express();
const MONGO_URL = process.env.MONGO_URL ;
const PORT = 3000
// Connect to MongoDB
mongoose.connect( MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Mentor model
const Mentor = mongoose.model('Mentor', {
  name: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
});

// Student model
const Student = mongoose.model('Student', {
  name: String,
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' }
});

app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Hello Everyone🥳🥳🥳");
  });

// Create a new mentor
app.post('/mentors', async (req, res) => {
  const { name } = req.body;
  try {
    const mentor = new Mentor({ name });
    await mentor.save();
    res.json(mentor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create mentor' });
  }
});

// Create a new student
app.post('/students', async (req, res) => {
  const { name } = req.body;
  try {
    const student = new Student({ name });
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create student' });
  }
});

// Assign student to mentor
app.post('/assign/:mentorId', async (req, res) => {
  const mentorId = req.params.mentorId;
  const { studentIds } = req.body;
  try {
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    const students = await Student.find({ _id: { $in: studentIds }, mentor: null });
    mentor.students.push(...students);
    students.forEach(async student => {
      student.mentor = mentor._id;
      await student.save();
    });
    await mentor.save();
    res.json({ message: 'Students assigned to mentor' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign students' });
  }
});

// Assign or change student's mentor
app.post('/assign-student/:studentId', async (req, res) => {
  const studentId = req.params.studentId;
  const { mentorId } = req.body;
  try {
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (student.mentor) {
      const prevMentor = await Mentor.findById(student.mentor);
      prevMentor.students.pull(student._id);
      await prevMentor.save();
    }
    mentor.students.push(student._id);
    student.mentor = mentor._id;
    await mentor.save();
    await student.save();
    res.json({ message: 'Student assigned to mentor' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign student' });
  }
});

// Get students of a mentor
app.get('/mentor-students/:mentorId', async (req, res) => {
  const mentorId = req.params.mentorId;
  try {
    const mentor = await Mentor.findById(mentorId).populate('students');
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }
    res.json(mentor.students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch mentor students' });
  }
});

// Get mentor of a student
app.get('/student-mentor/:studentId', async (req, res) => {
  const studentId = req.params.studentId;
  try {
    const student = await Student.findById(studentId).populate('mentor');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student.mentor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student mentor' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
