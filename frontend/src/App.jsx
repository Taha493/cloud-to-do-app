import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    const res = await fetch(`${API_URL}/todos`);
    const data = await res.json();
    setTodos(data);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async () => {
    if (!input.trim()) return;
    setLoading(true);
    await fetch(`${API_URL}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: input }),
    });
    setInput("");
    await fetchTodos();
    setLoading(false);
  };

  const toggleTodo = async (todo) => {
    await fetch(`${API_URL}/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: todo.title, completed: !todo.completed }),
    });
    await fetchTodos();
  };

  const deleteTodo = async (id) => {
    await fetch(`${API_URL}/todos/${id}`, { method: "DELETE" });
    await fetchTodos();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📝 Todo App</h1>
      <p style={styles.subtitle}>Microservices on Kubernetes</p>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a new task..."
        />
        <button style={styles.addBtn} onClick={addTodo} disabled={loading}>
          {loading ? "..." : "Add"}
        </button>
      </div>

      <ul style={styles.list}>
        {todos.length === 0 && (
          <p style={styles.empty}>No todos yet. Add one above!</p>
        )}
        {todos.map((todo) => (
          <li key={todo.id} style={styles.item}>
            <span
              onClick={() => toggleTodo(todo)}
              style={{
                ...styles.todoText,
                textDecoration: todo.completed ? "line-through" : "none",
                color: todo.completed ? "#aaa" : "#222",
                cursor: "pointer",
              }}
            >
              {todo.completed ? "✅" : "⬜"} {todo.title}
            </span>
            <button
              style={styles.deleteBtn}
              onClick={() => deleteTodo(todo.id)}
            >
              🗑
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "540px",
    margin: "60px auto",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "0 20px",
  },
  title: { fontSize: "2rem", margin: 0 },
  subtitle: { color: "#888", marginTop: "4px", marginBottom: "28px" },
  inputRow: { display: "flex", gap: "10px" },
  input: {
    flex: 1,
    padding: "10px 14px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none",
  },
  addBtn: {
    padding: "10px 20px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  list: { listStyle: "none", padding: 0, marginTop: "24px" },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  todoText: { fontSize: "1rem" },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
  },
  empty: { color: "#bbb", textAlign: "center", marginTop: "40px" },
};

export default App;
