import { usePDF } from 'react-to-pdf';

export default function Resume() {
  const { toPDF, targetRef } = usePDF({filename: 'resume.pdf'});

  return (
    <div>
      <button onClick={() => toPDF()} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Download PDF
      </button>
      <div ref={targetRef} className="max-w-4xl mx-auto p-6 bg-white">
        <header className="flex flex-col items-center text-center mb-8">
          <h1 className="text-4xl font-bold">JUAN TAMAYO</h1>
          <h2 className="text-xl text-gray-600">Software Developer</h2>
          <div className="flex flex-wrap justify-center items-center gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <MailIcon className="w-4 h-4 text-gray-600" />
              <span>juancyepest@gmail.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <GlobeIcon className="w-4 h-4 text-gray-600" />
              <span>www.juantamayo.xyz</span>
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
                A passionate developer who brings creative ideas from areas including networking, data storages,
                optimization and web applications. Looking for growth opportunities to try new technologies and grow my
                technical skills.
              </p>
            </section>
            <section className="mb-8">
              <h3 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">EXPERIENCE</h3>
              <div className="mb-4">
                <h4 className="text-xl font-semibold">Competitive Programming</h4>
                <div className="flex items-center space-x-2 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>07/2019 - Ongoing</span>
                  <MapPinIcon className="w-4 h-4" />
                  <span>Pereira, Colombia</span>
                </div>
                <p className="text-gray-600">Red de Programacion Competitiva (RPC)</p>
                <ul className="list-disc list-inside">
                  <li>Active participant in competitive programming contest in Latinoamerica such as RPC and ICPC.</li>
                  <li>Ability to solve problems in team using algorithms, math and creative strategies.</li>
                  <li>High experience in C++.</li>
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
                  <span>12/2018 - 2023</span>
                  <MapPinIcon className="w-4 h-4" />
                  <span>Pereira, Colombia</span>
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
                      <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gray-800 w-3/5" />
                    </div>
                    <span className="text-gray-600">Proficient</span>
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
                    <a href="#" className="text-blue-600">
                      www.linkedin.com/in/juantamayo26/
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <GlobeIcon className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="text-gray-600">Website</p>
                    <a href="#" className="text-blue-600">
                      www.juantamayo.xyz
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
                  "C/C++",
                  "Javascript",
                  "HTML/CSS",
                  "Typescript",
                  "Python",
                  "SQL",
                  "Unix",
                  "React",
                  "GraphQL",
                  "NodeJS",
                  "AWS",
                  "Git",
                  "TailwindCSS",
                  "GatsbyJS",
                  "Express",
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
                  <h4 className="text-xl font-semibold">CodTracker</h4>
                  <p>A discord bot implemented with codAPI for track user statistics of Warzone game.</p>
                  <ul className="list-disc list-inside">
                    <li>The information is saved in sqlite to optimize processes.</li>
                    <li>Implemented it as a service, running live on ec2.</li>
                    <li>When the api doesn't work, scrapped data and encoded to JSON.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xl font-semibold">My react website</h4>
                  <p>Full Stack Javascript Developer.</p>
                  <ul className="list-disc list-inside">
                    <li>
                      Fixed bugs and memory leaks with periodic code reviews among peers following the agile methodology.
                    </li>
                    <li>My website where I upload all my experience.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xl font-semibold">Algorithms</h4>
                  <p>More than a project is all my learning in algorithms.</p>
                  <ul className="list-disc list-inside">
                    <li>Skills in advance algorithms like KMP and DP optimizations.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xl font-semibold">Snake Game</h4>
                  <p>Snake game implemented with Genetic Algorithm.</p>
                  <ul className="list-disc list-inside">
                    <li>Using graphical computation with python.</li>
                    <li>The process of the genetic algorithm is saved in an .npy file.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xl font-semibold">LoreTriends</h4>
                  <p>A page for a client in which a database is implemented to follow processes.</p>
                  <ul className="list-disc list-inside">
                    <li>Develop a web application to create an interactive platform between organization and customers.</li>
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