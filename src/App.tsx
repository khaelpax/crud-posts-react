import { useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

const API = "https://jsonplaceholder.typicode.com/posts";

// JSONPlaceholder hanya menyimpan 100 post asli. Post baru hasil POST
// tidak benar-benar tersimpan, jadi PUT/DELETE ke id di atas 100 akan error.
// Untuk post baru itu kita cukup ubah tampilannya saja.
const MAX_SERVER_ID = 100;

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  // state form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // READ (GET): ambil 10 post saat tombol "Muat Data dari API" diklik
  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}?_limit=10`);
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      setPosts(await res.json());
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }

  // Pesan sukses yang hilang sendiri setelah 3 detik
  function showNotice(text: string) {
    setNotice(text);
    setTimeout(() => setNotice(""), 3000);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setBody("");
  }

  // CREATE (POST) dan UPDATE (PUT)
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingId === null) {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: 1, title, body }),
        });
        if (!res.ok) throw new Error("Gagal menambah data");
        // server selalu membalas id 101, jadi id dibuat sendiri agar unik
        const newId = Math.max(MAX_SERVER_ID, ...posts.map((p) => p.id)) + 1;
        setPosts([{ id: newId, userId: 1, title, body }, ...posts]);
        showNotice("Post berhasil ditambahkan");
      } else {
        const old = posts.find((p) => p.id === editingId)!;
        const updated: Post = { ...old, title, body };
        if (editingId <= MAX_SERVER_ID) {
          const res = await fetch(`${API}/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          });
          if (!res.ok) throw new Error("Gagal mengubah data");
        }
        setPosts(posts.map((p) => (p.id === editingId ? updated : p)));
        showNotice("Post berhasil diperbarui");
      }
      resetForm();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // DELETE
  async function handleDelete(id: number) {
    if (!window.confirm("Hapus post ini?")) return;
    setError("");
    try {
      if (id <= MAX_SERVER_ID) {
        const res = await fetch(`${API}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Gagal menghapus data");
      }
      setPosts(posts.filter((p) => p.id !== id));
      if (editingId === id) resetForm();
      showNotice("Post berhasil dihapus");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setTitle(post.title);
    setBody(post.body);
  }

  // Filter daftar berdasarkan kata di judul atau isi
  const shown = posts.filter((p) =>
    (p.title + p.body).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <header className="header">
        <h1>Manajemen Post</h1>
        <p>
          Aplikasi CRUD dengan React + TypeScript yang memakai API JSONPlaceholder.
          Perubahan hanya simulasi dan hilang saat halaman dimuat ulang.
        </p>
      </header>

      {error && <p className="alert error">{error}</p>}
      {notice && <p className="alert success">{notice}</p>}

      <div className="layout">
        {/* Kolom kiri: form tambah / edit */}
        <form onSubmit={handleSubmit} className="card form">
          <h2>{editingId === null ? "Tambah Post Baru" : `Edit Post #${editingId}`}</h2>

          <label>Judul</label>
          <input
            placeholder="Tulis judul post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label>Isi</label>
          <textarea
            placeholder="Tulis isi post"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />

          <div className="row">
            <button type="submit" className="btn primary">
              {editingId === null ? "Tambah" : "Simpan Perubahan"}
            </button>
            {editingId !== null && (
              <button type="button" className="btn" onClick={resetForm}>
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Kolom kanan: daftar post */}
        <section>
          <div className="toolbar">
            <h2>Daftar Post ({shown.length})</h2>
            <input
              className="search"
              placeholder="Cari post..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn" onClick={loadPosts}>
              Muat Data dari API
            </button>
          </div>

          {loading ? (
            <p className="empty">Memuat data...</p>
          ) : shown.length === 0 ? (
            <p className="empty">
              {posts.length === 0
                ? 'Daftar masih kosong. Tambahkan post lewat form, atau klik "Muat Data dari API".'
                : "Tidak ada post yang cocok dengan pencarian."}
            </p>
          ) : (
            <ul className="list">
              {shown.map((post) => (
                <li
                  key={post.id}
                  className={`card item ${editingId === post.id ? "editing" : ""}`}
                >
                  <div className="meta">
                    <span className={`badge color${post.userId % 5}`}>
                      Pengguna {post.userId}
                    </span>
                    <span className="id">Post #{post.id}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                  <div className="row">
                    <button className="btn" onClick={() => startEdit(post)}>
                      Edit
                    </button>
                    <button className="btn danger" onClick={() => handleDelete(post.id)}>
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
