%{
  title: "WhatsApp Reminders",
  period: "2024",
  image: "/images/projects/whatsapp-reminders-demo.png",
  url: "https://github.com/tamayotchi/WhatsAppReminders"
}
---

WhatsApp Reminders is a WhatsApp assistant that creates natural-language reminders and sends the reminder back through WhatsApp when it is due.

* Parses reminder requests from WhatsApp messages using OpenAI tool calls and stores the scheduled reminder.
* Supports voice-message transcription with Whisper so reminders can be created from audio as well as text.
* Includes a Rust scheduler that finds due reminders and sends WhatsApp template notifications.
