import http from 'http';
import chalk from 'chalk';
import courses from './data/courses.js';

// 1. Creating the server with Routing
const server = http.createServer((req, res) => {
  
  // Checking which URL path the user requested
  if (req.url === '/') {
    // ---- HOME PAGE ----
    console.log(chalk.blue('\n🏠 Notice: A user visited the Home Page (/)'));
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1 style="font-family: sans-serif; color: #2c3e50; text-align: center; margin-top: 50px;">Welcome to the Node.js School API! 🚀</h1><p style="text-align: center; font-size: 18px;">Go to <a href="/courses">/courses</a> to view the active courses.</p>');

  } else if (req.url === '/courses') {
    // ---- COURSES PAGE ----
    console.log(chalk.red.bold('\n🔥 Notice: A user requested the /courses data!'));
    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<pre style="font-family: monospace; background-color: #282c34; color: #abb2bf; padding: 20px; border-radius: 5px; font-size: 16px;">${JSON.stringify(courses, null, 2)}</pre>`);

  } else {
    // ---- 404 NOT FOUND ----
    console.log(chalk.yellow(`\n⚠️ Warning: Someone tried to visit a broken path: ${req.url}`));
    
    res.statusCode = 404; // Standard code for Not Found
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<h1 style="font-family: sans-serif; color: #e74c3c; text-align: center; margin-top: 50px;">404 - Page Not Found 🚫</h1>');
  }
});

// 2. Starting the server
server.listen(3000, () => {
  console.log(chalk.magenta.bold('\n=== Integrated Server with Routing is Running! ==='));
  console.log(chalk.cyan('Home Page: ') + chalk.yellow('http://localhost:3000'));
  console.log(chalk.cyan('Courses API: ') + chalk.yellow('http://localhost:3000/courses\n'));

  // Colorful printing of all courses from the array directly to the terminal!
  console.log(chalk.underline('--- List of Courses Loaded into the Project: ---'));
  courses.forEach(course => {
    console.log(chalk.cyan('Course ID:') + ` ${course.id}`);
    console.log(chalk.green('Course Name:') + ` ${course.name}`);
    console.log(chalk.yellow('Description:') + ` ${course.description}`);
    console.log(chalk.gray('---------------------------------------'));
  });
});