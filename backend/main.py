from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid

app = FastAPI(title="Todo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store (simple for this project)
todos = {}


class TodoCreate(BaseModel):
    title: str
    completed: Optional[bool] = False


class Todo(BaseModel):
    id: str
    title: str
    completed: bool


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/todos", response_model=List[Todo])
def get_todos():
    return list(todos.values())


@app.post("/todos", response_model=Todo, status_code=201)
def create_todo(todo: TodoCreate):
    todo_id = str(uuid.uuid4())
    new_todo = Todo(id=todo_id, title=todo.title, completed=todo.completed)
    todos[todo_id] = new_todo
    return new_todo


@app.put("/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: str, todo: TodoCreate):
    if todo_id not in todos:
        raise HTTPException(status_code=404, detail="Todo not found")
    updated = Todo(id=todo_id, title=todo.title, completed=todo.completed)
    todos[todo_id] = updated
    return updated


@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: str):
    if todo_id not in todos:
        raise HTTPException(status_code=404, detail="Todo not found")
    del todos[todo_id]
    return {"message": "Deleted successfully"}


