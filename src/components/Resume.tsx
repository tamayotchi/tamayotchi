import { PhoneIcon } from 'lucide-react';

export default function Resume() {
  return (
    <div>
      <div className="max-w-4xl mx-auto p-6 bg-white">
        <header className="flex flex-col items-center text-center mb-8">
          <h1 className="text-4xl font-bold">JUAN TAMAYO</h1>
          <h2 className="text-xl text-gray-600">Software Developer</h2>
          <div className="flex flex-wrap justify-center items-center gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <PhoneIcon className="w-4 h-4 text-gray-600" />
              <span>3174444258</span>
            </div>
            <div className="flex items-center space-x-2">
              <MailIcon className="w-4 h-4 text-gray-600" />
              <span>juancyepest@gmail.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <GlobeIcon className="w-4 h-4 text-gray-600" />
              <span>https://tamayotchi.com/</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-4 h-4 text-gray-600" />
              <span>Colombia</span>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <section className="mb-8">
              <h3 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">SUMMARY</h3>
              <p>
                A passionate developer who brings creative ideas from areas such as web applications, optimizations, infrastructure and data storage. Seeking opportunities to explore new technologies and further develop my technical skills.
              </p>
            </section>
            <section className="mb-8">
              <h3 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">EXPERIENCE</h3>
              <div className="mb-4">
                <h4 className="text-xl font-semibold">Backend Engineer</h4>
                <div className="flex items-center space-x-2 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>07/2021 - Present</span>
                  <MapPinIcon className="w-4 h-4" />
                  <span>Remote</span>
                </div>
                <p className="text-gray-600">Instaleap - https://instaleap.io/</p>
                <ul className="list-disc list-inside">
                  <li>Focus on developing and optimizing scalable systems that support last-mile logistics and e-commerce operations for large retailers, ensuring smooth delivery processes and enhancing overall system performance.</li>
                  <li>Applied design patterns and best coding practices to maintain clean, maintainable code.</li>
                  <li>Built horizontally scalable systems using Terraform, PostgreSQL, and AWS to support high-demand operations.</li>
                  <li>Optimized processes and queries, significantly improving system performance, stability, and speed.</li>
                  <li>Debugged and resolved critical issues reported by users, identifying edge cases and improving system resilience.</li>
                  <li>Designed and developed new features.</li>
                  <li>Contributed innovative ideas to improve workflows and optimize development processes within the team.</li>
                  <li>Developed algorithms to optimize delivery workflows, enhancing operational efficiency and scalability within Instaleap's platform.</li>
                </ul>
              </div>
              <div className="mb-4">
                <h4 className="text-xl font-semibold">Competitive Programming</h4>
                <div className="flex items-center space-x-2 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>07/2019 - 11/2023</span>
                  <MapPinIcon className="w-4 h-4" />
                  <span>Pereira, Colombia</span>
                </div>
                <p className="text-gray-600">Red de Programacion Competitiva (RPC)</p>
                <ul className="list-disc list-inside">
                  <li>Active participant in competitive programming contest in Latinoamerica such as RPC and ICPC.</li>
                  <li>Ability to solve problems in team using algorithms, math and creative strategies.</li>
                  <li>High experience in C++ and Python.</li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-semibold">Freelance Web Developer</h4>
                <div className="flex items-center space-x-2 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>2019 - 2020</span>
                  <MapPinIcon className="w-4 h-4" />
                  <span>Colombia</span>
                </div>
                <p className="text-gray-600">Self-Employed Web Developer</p>
                <ul className="list-disc list-inside">
                  <li>Increase in sales through clean and user-friendly design.</li>
                  <li>Implemented color theory to convey each clients specific need.</li>
                  <li>Optimized a client website for speed and SEO.</li>
                </ul>
              </div>
            </section>
            <section className="mb-8">
              <h3 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">EDUCATION</h3>
              <div>
                <h4 className="text-xl font-semibold">Software Engineer</h4>
                <p className="text-gray-600">Technological University of Pereira</p>
                <div className="flex items-center space-x-2 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>12/2018</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>GPA</span>
                  <span>4.0 / 5.0</span>
                </div>
              </div>
            </section>
            <section className="mb-8">
              <h3 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">LANGUAGES</h3>
              <div className="flex justify-between">
                <div className="w-1/2">
                  <h4 className="text-xl font-semibold">Spanish</h4>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-800 w-full" />
                    </div>
                    <span className="text-gray-600">Native</span>
                  </div>
                </div>
                <div className="w-1/2">
                  <h4 className="text-xl font-semibold">English</h4>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-800 w-4/5" />
                    </div>
                    <span className="text-gray-600">Advanced</span>
                  </div>
                </div>
              </div>
            </section>
            <section className="mb-8">
              <h3 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">FIND ME</h3>
              <div className="flex space-x-8">
                <div className="flex items-center space-x-2">
                  <LinkedinIcon className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="text-gray-600">LinkedIn</p>
                    <a href="https://www.linkedin.com/in/juantamayo26/" className="text-blue-600">
                      www.linkedin.com/in/juantamayo26/
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <GlobeIcon className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="text-gray-600">Website</p>
                    <a href="https://tamayotchi.com/" className="text-blue-600">
                      https://tamayotchi.com/
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div>
            <section className="mb-8">
              <h3 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">SKILLS</h3>
              <div className="flex flex-wrap">
                {[
                  "Typescript",
                  "AWS",
                  "React",
                  "PostgreSQL",
                  "C/C++",
                  "GCP",
                  "Terraform",
                  "Python",
                  "DynamoDB"
                ].map((skill) => (
                  <span key={skill} className="bg-gray-200 text-gray-800 text-sm font-semibold mr-2 mb-2 px-4 py-2 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">PROJECTS</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-semibold">WhatsApp Reminders</h4>
                  <ul className="list-disc list-inside">
                    <li>Built a WhatsApp Bot that allows users to set reminders via natural language messages using ChatGPT and Whisper API.</li>
                    <li>Utilized GCP Runner for processing incoming messages.</li>
                    <li>Implemented AWS Lambda on Rust to manage reminders.</li>
                    <li>Employed DynamoDB for storing and managing reminder data efficiently.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xl font-semibold">CodTracker</h4>
                  <ul className="list-disc list-inside">
                    <li>A discord bot implemented with codAPI for track user statistics of Warzone game.</li>
                    <li>The information is saved in sqlite to optimize processes.</li>
                    <li>Implemented it as a service, running live on EC2.</li>
                    <li>When the API doesn't work, scrapped data and encoded to JSON.</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CalendarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GlobeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LinkedinIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MailIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MapPinIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  }
