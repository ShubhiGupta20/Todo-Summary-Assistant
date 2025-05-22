
// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const { Configuration, OpenAIApi } = require('openai');
// const { IncomingWebhook } = require('@slack/webhook');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// let todos = [];

// // Load from todos.json on start (optional)
// try {
//   todos = JSON.parse(fs.readFileSync('todos.json'));
// } catch (e) {
//   todos = [];
// }

// // Routes
// app.get('/todos', (req, res) => {
//   res.json(todos);
// });

// app.post('/todos', (req, res) => {
//   const todo = req.body;
//   todos.push(todo);
//   fs.writeFileSync('todos.json', JSON.stringify(todos));
//   res.status(201).json(todo);
// });

// app.delete('/todos/:id', (req, res) => {
//   const id = req.params.id;
//   todos = todos.filter(t => t.id !== id);
//   fs.writeFileSync('todos.json', JSON.stringify(todos));
//   res.json({ message: 'Deleted' });
// });

// app.post('/summarize', async (req, res) => {
//   try {
//     const config = new Configuration({
//       apiKey: process.env.OPENAI_API_KEY,
//     });
//     const openai = new OpenAIApi(config);

//     const todoText = todos.map((t, i) => `${i + 1}. ${t.text}`).join('\n');
//     const prompt = `Summarize the following todos:\n${todoText}`;

//     const response = await openai.createChatCompletion({
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: prompt }],
//     });

//     const summary = response.data.choices[0].message.content;

//     // Send to Slack
//     const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
//     await webhook.send({
//       text: `📝 Todo Summary:\n${summary}`,
//     });

//     res.json({ success: true, summary });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json({ success: false, error: 'Failed to summarize or send to Slack.' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });





const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let todos = [];

// Get all todos
app.get('/todos', (req, res) => {
  res.json(todos);
});

// Add a new todo
app.post('/todos', (req, res) => {
  const todo = req.body;
  todos.push(todo);
  res.status(201).json(todo);
});

// Delete a todo
app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  todos = todos.filter((t) => t.id !== id);
  res.status(204).send();
});

// Summarize and send to Slack
app.post('/summarize', async (req, res) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const todoText = todos.map((t, i) => `${i + 1}. ${t.text}`).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: "You are a helpful assistant summarizing a user's to-do list." },
        { role: 'user', content: `Summarize the following todos:\n${todoText}` }
      ]
    });

    const summary = completion.choices[0].message.content;

    // Send to Slack using Incoming Webhook
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: summary })
    });

    res.status(200).json({ message: 'Summary sent to Slack' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate or send summary' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
