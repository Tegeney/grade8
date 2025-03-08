bot.onText(/\/result (\d{7}) (\w+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const registrationNumber = match[1];
    const firstName = match[2];

    // Fetch student result
    const studentData = await getStudentResult(registrationNumber, firstName);

    if (studentData) {
        const { student, courses } = studentData;
        const studentInfo = `
            *Student Name:* ${student.name}
            *Age:* ${student.age}
            *School:* ${student.school}
            *Woreda:* ${student.woreda}
            *Zone:* ${student.zone}
            *Language:* ${student.language}
            *Gender:* ${student.gender}
            *Nationality:* ${student.nationality}
        `;
        
        const coursesList = courses.map(course => course.name).join('\n');

        const message = `
            ${studentInfo}
            \n*Courses:*\n${coursesList}
        `;

        bot.sendPhoto(chatId, student.photo, {
            caption: message,
            parse_mode: 'Markdown'
        });

    } else {
        bot.sendMessage(chatId, 'Sorry, I couldn\'t fetch the student information. Please try again later.');
    }
});
