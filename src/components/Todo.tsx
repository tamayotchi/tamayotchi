import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Task {
  id: number
  text: string
  completed: boolean
}

export default function Todo() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Buy groceries", completed: false },
    { id: 2, text: "Clean the house", completed: true },
    { id: 3, text: "Call mom", completed: false },
  ])
  const [newTask, setNewTask] = useState("")

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false }])
      setNewTask("")
    }
  }

  const removeTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full px-4 sm:px-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="flex-1 bg-muted rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button onClick={addTask} className="px-4 py-2 rounded-md text-sm font-medium">Add</Button>
          </div>
          <div className="flex flex-col gap-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between bg-muted rounded-md px-4 py-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                  <Label
                    htmlFor={`task-${task.id}`}
                    className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.text}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTask(task.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}