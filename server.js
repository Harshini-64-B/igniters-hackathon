const express = require('express');
const mysql   = require('mysql2');
const cors    = require('cors');
const path    = require('path');
const nodemailer = require('nodemailer');

// configure your SMTP transport (example uses Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.SMTP_USER,    // e.g. your Gmail address
    pass: process.env.SMTP_PASS     // app password or real password
  }
});


const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Harshini@28_03',
  database: 'TinkerLab'
});

connection.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL!');
});

// ── New: fetch authorizers by role ──────────────────────────────────────────
app.get('/users', (req, res) => {
  const rolesParam = req.query.roles || '';
  const roles = rolesParam.split(',').map(r => r.trim()).filter(r => r);
  if (!roles.length) return res.json([]);

  // build placeholders (?, ?, …)
  const placeholders = roles.map(_ => '?').join(',');
  const sql = `
    SELECT user_id, name, role
      FROM users
     WHERE role IN (${placeholders})
  `;
  connection.query(sql, roles, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ── Your existing equipment route ───────────────────────────────────────────
app.get('/equipment', (req, res) => {
  connection.query('SELECT * FROM equipment', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(results);
    }
  });
});

// ── Modified reserve route to accept + store authorizer_id ──────────────────
app.post('/reserve', (req, res) => {
  const {
    equipmentName,
    studentName,
    studentEmail,
    projectName,
    duration,
    purpose,
    authorizer            // ← new field from your form
  } = req.body;

  console.log('Form data received:', req.body);

  // require authorizer now too
  if (!equipmentName || !studentName || !studentEmail || !duration || !authorizer) {
    return res.status(400).send('Please fill in all required fields, including approver.');
  }

  // 1. Find equipment_id
  connection.query(
    'SELECT equipment_id FROM equipment WHERE name = ?',
    [equipmentName],
    (equipErr, equipResults) => {
      if (equipErr) {
        console.error('Error fetching equipment:', equipErr);
        return res.status(500).send('Database error while fetching equipment.');
      }
      if (equipResults.length === 0) {
        return res.status(404).send('Equipment not found.');
      }
      const equipment_id = equipResults[0].equipment_id;

      // 2. Find student_id
      connection.query(
        'SELECT user_id FROM users WHERE email = ?',
        [studentEmail],
        (userErr, userResults) => {
          if (userErr) {
            console.error('Error fetching user:', userErr);
            return res.status(500).send('Database error while fetching user.');
          }
          if (userResults.length === 0) {
            return res.status(404).send('Student not found. Please register first.');
          }
          const student_id = userResults[0].user_id;

          // 3. Insert reservation, now including authorizer_id
          const insertQuery = `
            INSERT INTO reservations (
              equipment_id,
              student_id,
              project_name,
              duration,
              purpose,
              status,
              authorizer_id
            )
            VALUES (?, ?, ?, ?, ?, 'pending', ?)
          `;

          connection.query(
            insertQuery,
            [equipment_id, student_id, projectName, duration, purpose, authorizer],
            (insertErr, insertResult) => {
              if (insertErr) {
                console.error('Error inserting reservation:', insertErr);
                return res.status(500).send('Database error while saving reservation.');
              }
              console.log('Reservation inserted successfully.');
              // lookup authorizer’s contact
              connection.query(
                'SELECT name, email FROM users WHERE user_id = ?',
                [authorizer],
                (authErr, authRows) => {
                  if (authErr || !authRows.length) {
                    console.error('Could not fetch authorizer info:', authErr);
                    return;
                  }
                  const { name: approverName, email: approverEmail } = authRows[0];

                  // send notification
                  transporter.sendMail({
                    from:    '"TinkerLab" <no-reply@tinkerlab.com>',
                    to:      approverEmail,
                    subject: `New reservation for ${equipmentName}`,
                    text:    `
              Hello ${approverName},

              ${studentName} (${studentEmail}) has requested:
                "${equipmentName}" 
                for project "${projectName}" 
                (Duration: ${duration})

              Log into your dashboard to approve or reject this request.

              Thanks,
              Tinker Lab System
              `
                  }, (mailErr, info) => {
                    if (mailErr) console.error('Mail error:', mailErr);
                    else console.log('Notification sent:', info.response);
                  });
                }
              );
              res.send(`
                <h2>Reservation submitted successfully!</h2>
                <p><a href="/equipment.html">Go back to Catalog</a></p>
              `);
            }
          );
        }
      );
    }
  );
});

// ✅ Register
app.post('/register', (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    return res.send('Please fill all required fields.');
  }

  const checkQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(checkQuery, [email], (err, results) => {
    if (err) return res.status(500).send('Database error.');
    if (results.length > 0) return res.send('Account already exists !!');

    const insertQuery = `
      INSERT INTO users (name, email, password, department, role)
      VALUES (?, ?, ?, ?, 'student')
    `;
    connection.query(insertQuery, [name, email, password, department], (err) => {
      if (err) return res.status(500).send('Error saving user.');
      res.send('Registered successfully! <a href="/login.html">Login here</a>');
    });
  });
});

// ✅ Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const loginQuery = 'SELECT * FROM users WHERE email = ? AND password = ?';
  connection.query(loginQuery, [email, password], (err, results) => {
    if (err) return res.status(500).send('Database error.');
    if (results.length === 0) {
      return res.send("Account doesn't exist. Please <a href='/register.html'>register</a>.");
    }

    const username = results[0].name;
    res.send(`
      <h2>Welcome, ${username}!</h2>
      <p><a href="/index.html">Go to Home</a></p>
    `);
  });
});


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
