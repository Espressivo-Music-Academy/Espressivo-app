
const userRecords = [
  { name: "Caleb", phone: "92336245", role: "student" },
  { name: "Mario", phone: "90213593", role: "teacher" },
  { name: "Vivian", phone: "82991175", role: "admin" }
];

let lessons = JSON.parse(localStorage.getItem("lessons") || "[]");

function switchView(role) {
  const views = ["registerView", "studentView", "teacherView", "adminView"];
  views.forEach(id => document.getElementById(id).classList.add("hidden"));
  const titleMap = {
    student: "Student Dashboard",
    teacher: "Teacher Dashboard",
    admin: "Admin Dashboard"
  };
  document.getElementById("title").textContent = titleMap[role] || "Espressivo Mobile App";
  document.getElementById(`${role}View`).classList.remove("hidden");

  if (role === "admin") populateAdminData();
  if (role === "student") showStudentLesson();
}

function loginUser() {
  const name = document.getElementById("studentName").value.trim();
  const phone = document.getElementById("studentPhone").value.trim();
  const user = userRecords.find(
    u => u.name.toLowerCase() === name.toLowerCase() && u.phone === phone
  );
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    switchView(user.role);
  } else {
    alert("Invalid name or phone number.");
  }
}

function bookLesson() {
  const student = document.getElementById("studentDropdown").value;
  const type = document.getElementById("lessonTypeDropdown").value;
  const dateTime = document.getElementById("lessonDateTime").value;
  const makeup = document.getElementById("makeup").checked;

  if (!student || !type || !dateTime) {
    alert("Please fill all fields.");
    return;
  }

  const duration = makeup ? 60 : 45;
  const lesson = {
    id: Date.now(),
    student,
    type,
    dateTime,
    duration,
    status: "Scheduled",
    attendance: "Pending"
  };

  lessons.push(lesson);
  localStorage.setItem("lessons", JSON.stringify(lessons));
  populateLessonList();
}

function populateAdminData() {
  const dropdown = document.getElementById("studentDropdown");
  dropdown.innerHTML = "";
  const students = userRecords.filter(u => u.role === "student");
  students.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    dropdown.appendChild(opt);
  });
  populateLessonList();
}

function populateLessonList() {
  const list = document.getElementById("lessonList");
  list.innerHTML = "";
  lessons.forEach(lesson => {
    const li = document.createElement("li");
    li.innerHTML = \`\${lesson.student} - \${lesson.type} - \${new Date(lesson.dateTime).toLocaleString()} (\${lesson.duration} mins)
    [\${lesson.attendance}]
    <button onclick="markAttended(\${lesson.id})">✔</button>
    <button onclick="cancelLesson(\${lesson.id})">✖</button>\`;
    list.appendChild(li);
  });
}

function markAttended(id) {
  lessons = lessons.map(l => l.id === id ? { ...l, attendance: "Attended" } : l);
  localStorage.setItem("lessons", JSON.stringify(lessons));
  populateLessonList();
}

function cancelLesson(id) {
  if (!confirm("Cancel this lesson?")) return;
  lessons = lessons.filter(l => l.id !== id);
  localStorage.setItem("lessons", JSON.stringify(lessons));
  populateLessonList();
}

function showStudentLesson() {
  const user = JSON.parse(localStorage.getItem("user"));
  const lesson = lessons.find(l => l.student === user.name);
  if (lesson) {
    document.getElementById("lessonDetails").textContent =
      \`\${lesson.type} on \${new Date(lesson.dateTime).toLocaleString()} for \${lesson.duration} mins\`;
  } else {
    document.getElementById("lessonDetails").textContent = "No upcoming lessons.";
  }
}

window.onload = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user) switchView(user.role);
  else document.getElementById("registerView").classList.remove("hidden");
};



function renderTeacherCalendar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const calendarDiv = document.getElementById("teacherCalendar");
  calendarDiv.innerHTML = "";
  const teacherLessons = lessons
    .filter(l => l.teacher === user.name || !l.teacher) // Simplified filtering
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  if (teacherLessons.length === 0) {
    calendarDiv.innerHTML = "<p>No lessons found.</p>";
    return;
  }

  teacherLessons.forEach(l => {
    const p = document.createElement("p");
    p.textContent = \`\${l.student} - \${l.type} on \${new Date(l.dateTime).toLocaleString()}\`;
    calendarDiv.appendChild(p);
  });
}

function searchStudentProfile() {
  const keyword = document.getElementById("searchStudent").value.trim().toLowerCase();
  const results = lessons
    .filter(l => l.student.toLowerCase().includes(keyword))
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  const list = document.getElementById("studentProfile");
  list.innerHTML = "";
  results.forEach(l => {
    const li = document.createElement("li");
    li.textContent = \`\${l.dateTime} - \${l.student} - \${l.type} - \${l.attendance}\`;
    list.appendChild(li);
  });
}



let rescheduleRequests = JSON.parse(localStorage.getItem("rescheduleRequests") || "[]");

function requestReschedule() {
  const user = JSON.parse(localStorage.getItem("user"));
  const existing = rescheduleRequests.find(r => r.student === user.name && r.status === "Pending");
  if (existing) {
    alert("You already have a pending request.");
    return;
  }

  const requestedTime = prompt("Enter preferred new date and time (YYYY-MM-DD HH:MM):");
  if (!requestedTime) return;

  const lesson = lessons.find(l => l.student === user.name);
  if (!lesson) {
    alert("No booked lesson found.");
    return;
  }

  const req = {
    id: Date.now(),
    student: user.name,
    lessonId: lesson.id,
    originalTime: lesson.dateTime,
    requestedTime,
    status: "Pending",
    notes: ""
  };

  rescheduleRequests.push(req);
  localStorage.setItem("rescheduleRequests", JSON.stringify(rescheduleRequests));
  document.getElementById("requestStatus").textContent = "Pending: " + requestedTime;
  document.getElementById("cancelButton").disabled = false;
  updateRescheduleList();
}

function cancelRequest() {
  const user = JSON.parse(localStorage.getItem("user"));
  rescheduleRequests = rescheduleRequests.filter(r => !(r.student === user.name && r.status === "Pending"));
  localStorage.setItem("rescheduleRequests", JSON.stringify(rescheduleRequests));
  document.getElementById("requestStatus").textContent = "Request cancelled.";
  document.getElementById("cancelButton").disabled = true;
  updateRescheduleList();
}

function updateRescheduleList() {
  const list = document.getElementById("rescheduleList");
  if (!list) return;
  list.innerHTML = "";

  rescheduleRequests.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = \`
      <strong>\${r.student}</strong>: \${new Date(r.originalTime).toLocaleString()} → \${r.requestedTime}
      [\${r.status}]
      <button onclick="updateRequestStatus(\${r.id}, 'Approved')">✔</button>
      <button onclick="updateRequestStatus(\${r.id}, 'Rejected')">✖</button>
      <button onclick="updateRequestStatus(\${r.id}, 'Pending')">⏳</button>
    \`;
    list.appendChild(li);
  });
}

function updateRequestStatus(id, status) {
  rescheduleRequests = rescheduleRequests.map(r =>
    r.id === id ? { ...r, status } : r
  );
  localStorage.setItem("rescheduleRequests", JSON.stringify(rescheduleRequests));
  updateRescheduleList();
}

function showStudentLesson() {
  const user = JSON.parse(localStorage.getItem("user"));
  const lesson = lessons.find(l => l.student === user.name);
  if (lesson) {
    document.getElementById("lessonDetails").textContent =
      \`\${lesson.type} on \${new Date(lesson.dateTime).toLocaleString()} for \${lesson.duration} mins\`;
    const req = rescheduleRequests.find(r => r.student === user.name && r.status === "Pending");
    if (req) {
      document.getElementById("requestStatus").textContent = "Pending: " + req.requestedTime;
      document.getElementById("cancelButton").disabled = false;
    } else {
      document.getElementById("requestStatus").textContent = "No request made.";
      document.getElementById("cancelButton").disabled = true;
    }
  } else {
    document.getElementById("lessonDetails").textContent = "No upcoming lessons.";
  }
}



function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

function notify(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

function scheduleLessonNotification(lesson) {
  const lessonTime = new Date(lesson.dateTime).getTime();
  const now = Date.now();
  const reminderTime = lessonTime - 12 * 60 * 60 * 1000;

  if (reminderTime > now) {
    const timeout = reminderTime - now;
    setTimeout(() => {
      notify('Lesson Reminder', `You have a ${lesson.type} today at ${new Date(lesson.dateTime).toLocaleTimeString()}`);
    }, timeout);
  }
}

function showStudentLesson() {
  const user = JSON.parse(localStorage.getItem("user"));
  const lesson = lessons.find(l => l.student === user.name);
  if (lesson) {
    document.getElementById("lessonDetails").textContent =
      \`\${lesson.type} on \${new Date(lesson.dateTime).toLocaleString()} for \${lesson.duration} mins\`;
    scheduleLessonNotification(lesson);

    const req = rescheduleRequests.find(r => r.student === user.name && r.status === "Pending");
    if (req) {
      document.getElementById("requestStatus").textContent = "Pending: " + req.requestedTime;
      document.getElementById("cancelButton").disabled = false;
    } else {
      document.getElementById("requestStatus").textContent = "No request made.";
      document.getElementById("cancelButton").disabled = true;
    }
  } else {
    document.getElementById("lessonDetails").textContent = "No upcoming lessons.";
  }
}

function updateRequestStatus(id, status) {
  rescheduleRequests = rescheduleRequests.map(r =>
    r.id === id ? { ...r, status } : r
  );
  localStorage.setItem("rescheduleRequests", JSON.stringify(rescheduleRequests));

  const req = rescheduleRequests.find(r => r.id === id);
  const lesson = lessons.find(l => l.id === req.lessonId);

  if (lesson && (status === 'Approved' || status === 'Rejected')) {
    notify("Lesson Update", \`Lesson for \${lesson.student} has been \${status.toLowerCase()}.\`);
  }

  updateRescheduleList();
}

window.onload = () => {
  requestNotificationPermission();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user) switchView(user.role);
  else document.getElementById("registerView").classList.remove("hidden");
};



function bookLesson() {
  const student = document.getElementById("studentDropdown").value;
  const type = document.getElementById("lessonTypeDropdown").value;
  const dateTime = document.getElementById("lessonDateTime").value;
  const makeup = document.getElementById("makeup").checked;
  const repeatWeeks = parseInt(document.getElementById("repeatWeeks").value);

  if (!student || !type || !dateTime) {
    alert("Please fill all fields.");
    return;
  }

  const duration = makeup ? 60 : 45;
  const baseDate = new Date(dateTime);

  for (let i = 0; i <= repeatWeeks; i++) {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + i * 7);

    const lesson = {
      id: Date.now() + i,
      student,
      type,
      dateTime: newDate.toISOString(),
      duration,
      status: "Scheduled",
      attendance: "Pending"
    };

    lessons.push(lesson);
  }

  localStorage.setItem("lessons", JSON.stringify(lessons));
  populateLessonList();
}
