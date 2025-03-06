import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";

interface Task {
  id: string;
  title: string;
  content: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const initialColumns: Column[] = [
  { id: "backlog", title: "Backlog", tasks: [] },
  { id: "blocked", title: "Blocked", tasks: [] },
  { id: "inProgress", title: "In Progress", tasks: [] },
  { id: "done", title: "Done", tasks: [] },
];

const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const addTask = () => {
    if (newTaskTitle.trim() !== "") {
      setColumns((prevColumns) => {
        const updatedColumns = prevColumns.map((column) => {
          if (column.id === "backlog") {
            return {
              ...column,
              tasks: [
                ...column.tasks,
                {
                  id: Date.now().toString(),
                  title: newTaskTitle.trim(),
                  content: ``,
                },
              ],
            };
          }
          return column;
        });
        return updatedColumns;
      });
      setNewTaskTitle("");
    }
  };

  const onDragStart = (
    e: React.DragEvent,
    taskId: string,
    sourceColumnId: string,
  ) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceColumnId", sourceColumnId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColumnId = e.dataTransfer.getData("sourceColumnId");

    if (sourceColumnId !== targetColumnId) {
      setColumns((prevColumns) => {
        const updatedColumns = prevColumns.map((column) => {
          if (column.id === sourceColumnId) {
            return {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== taskId),
            };
          }
          if (column.id === targetColumnId) {
            const task = prevColumns
              .find((col) => col.id === sourceColumnId)
              ?.tasks.find((t) => t.id === taskId);
            if (task) {
              return {
                ...column,
                tasks: [...column.tasks, task],
              };
            }
          }
          return column;
        });
        return updatedColumns;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <h1 className="text-4xl font-bold mb-8 text-indigo-300">
        ❄️ Kanban Board
      </h1>
      <Card className="bg-slate-800 p-6 mb-8 border-slate-700">
        <h2 className="text-2xl font-semibold mb-4 text-indigo-200">
          Add New Task
        </h2>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-grow bg-slate-700 text-slate-100 border-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Button
            onClick={addTask}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <Card key={column.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4 text-indigo-200">
                {column.title}
              </h2>
              <div
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, column.id)}
                className="bg-slate-700 p-4 rounded-lg min-h-[200px]"
              >
                {column.tasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id, column.id)}
                    className="mb-2 bg-slate-600 hover:bg-slate-500 transition-colors cursor-move border-slate-500"
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-indigo-100">
                          {task.title}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-slate-300">{task.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
