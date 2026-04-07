import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:3001/api";

const emptyForm = {
  title: "",
  author: "",
  isbn: "",
  genre: "Technology",
  language: "English",
  shelfLocation: "",
  totalCopies: 1,
  availableCopies: 1,
  description: "",
};

const API_BASE = '/api'

function App() {
  const [loginForm, setLoginForm] = useState({ userName: "", password: "" });
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("Please login as librarian/admin.");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [genreFilter, setGenreFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");

  const totalPages = useMemo(() => {
    if (!total || !size) {
      return 1;
    }
    return Math.max(1, Math.ceil(total / size));
  }, [total, size]);

  async function handleLogin(event) {
    event.preventDefault();
    setStatus("Logging in...");

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Login failed.");
      }

      setToken(body.data.token);
      setStatus(`Logged in as ${body.data.role}.`);
    } catch (error) {
      setStatus(error.message || "Login failed.");
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function toQuery(params) {
    return new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
    ).toString();
  }

  async function loadBooks(nextPage = page) {
    if (!token) {
      return;
    }

    const query = toQuery({
      page: nextPage,
      size,
      genre: genreFilter,
      availability: availabilityFilter,
    });

    try {
      const response = await fetch(`${API_BASE}/librarian/books?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Load failed.");
      }

      setBooks(body.data.list);
      setTotal(body.data.total);
      setPage(body.data.page);
      setStatus("Inventory loaded.");
    } catch (error) {
      setStatus(error.message || "Load failed.");
    }
  }

  useEffect(() => {
    loadBooks(1);
  }, [token]);

  async function handleSave(event) {
    event.preventDefault();

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API_BASE}/librarian/books/${editingId}`
      : `${API_BASE}/librarian/books`;

    setStatus(editingId ? "Updating book..." : "Creating book...");

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          totalCopies: Number(form.totalCopies),
          availableCopies: Number(form.availableCopies),
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Save failed.");
      }

      setStatus(body.message || "Saved.");
      resetForm();
      await loadBooks(1);
    } catch (error) {
      setStatus(error.message || "Save failed.");
    }
  }

  function beginEdit(book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre,
      language: book.language,
      shelfLocation: book.shelfLocation || "",
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      description: book.description || "",
    });
    setStatus(`Editing ${book.title}`);
  }

  async function archiveBook(bookId) {
    setStatus("Archiving book...");

    try {
      const response = await fetch(`${API_BASE}/librarian/books/${bookId}/archive`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || "Archive failed.");
      }

      setStatus(body.message || "Archived.");
      await loadBooks(1);
    } catch (error) {
      setStatus(error.message || "Archive failed.");
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Librarian Console</p>
        <h1>Release 1 - Book Management</h1>
        <p className="sub">Create, edit, filter inventory, and archive books safely.</p>
      </section>

      <section className="panel">
        <h2>1) Login</h2>
        <form className="grid" onSubmit={handleLogin}>
          <input
            placeholder="email"
            value={loginForm.userName}
            onChange={(event) => setLoginForm((prev) => ({ ...prev, userName: event.target.value }))}
          />
          <input
            placeholder="password"
            type="password"
            value={loginForm.password}
            onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          <button type="submit">Login</button>
        </form>
      </section>

      <section className="panel">
        <h2>{editingId ? "2) Edit Book" : "2) Create Book"}</h2>
        <form className="grid" onSubmit={handleSave}>
          <input
            required
            placeholder="title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <input
            required
            placeholder="author"
            value={form.author}
            onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
          />
          <input
            required
            placeholder="isbn"
            value={form.isbn}
            onChange={(event) => setForm((prev) => ({ ...prev, isbn: event.target.value }))}
          />
          <input
            required
            placeholder="shelfLocation"
            value={form.shelfLocation}
            onChange={(event) => setForm((prev) => ({ ...prev, shelfLocation: event.target.value }))}
          />
          <select value={form.genre} onChange={(event) => setForm((prev) => ({ ...prev, genre: event.target.value }))}>
            <option value="Technology">Technology</option>
            <option value="Fiction">Fiction</option>
            <option value="Science">Science</option>
            <option value="History">History</option>
            <option value="Management">Management</option>
          </select>
          <select
            value={form.language}
            onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
          >
            <option value="English">English</option>
            <option value="Chinese">Chinese</option>
            <option value="Others">Others</option>
          </select>
          <input
            required
            type="number"
            min="0"
            placeholder="totalCopies"
            value={form.totalCopies}
            onChange={(event) => setForm((prev) => ({ ...prev, totalCopies: event.target.value }))}
          />
          <input
            required
            type="number"
            min="0"
            placeholder="availableCopies"
            value={form.availableCopies}
            onChange={(event) => setForm((prev) => ({ ...prev, availableCopies: event.target.value }))}
          />
          <textarea
            rows="3"
            placeholder="description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <div className="actions">
            <button type="submit">{editingId ? "Update" : "Create"}</button>
            {editingId ? (
              <button type="button" className="ghost" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>3) Inventory</h2>
          <div className="filters">
            <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
              <option value="">all genre</option>
              <option value="Technology">Technology</option>
              <option value="Fiction">Fiction</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
              <option value="Management">Management</option>
            </select>
            <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
              <option value="">all availability</option>
              <option value="AVAILABLE">available</option>
              <option value="UNAVAILABLE">unavailable</option>
            </select>
            <button type="button" onClick={() => loadBooks(1)}>
              Apply Filter
            </button>
          </div>
        </div>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>ISBN</th>
                <th>Genre</th>
                <th>Copies</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>{book.title}</td>
                  <td>{book.isbn}</td>
                  <td>{book.genre}</td>
                  <td>{book.availableCopies}/{book.totalCopies}</td>
                  <td>{book.available ? "YES" : "NO"}</td>
                  <td className="actions">
                    <button type="button" className="ghost" onClick={() => beginEdit(book)}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => archiveBook(book.id)}>
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <button type="button" disabled={page <= 1} onClick={() => loadBooks(page - 1)}>
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => loadBooks(page + 1)}>
            Next
          </button>
        </div>
      </section>

      <p className="status">{status}</p>
    </main>
  );
}

export default App;
