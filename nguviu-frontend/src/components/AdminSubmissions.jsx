import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import notify from "../utils/notify";
import AdminButton from "./AdminButton";

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

function Spinner() {
  return <div style={{ padding: 12 }}>Loading…</div>;
}

export default function AdminSubmissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 700);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function load(p = page) {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (query) qs.set("search", query);
      if (statusFilter) qs.set("status", statusFilter);
      qs.set("page", p);
      qs.set("limit", limit);
      const data = await apiFetch(`/api/submissions?${qs.toString()}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, [limit]);

  async function refreshAndClose() {
    await load();
    setSelected(null);
  }

  async function doAction(id, action) {
    try {
      setLoading(true);
      if (action === "delete") {
        await apiFetch(`/api/submissions/${id}`, { method: "DELETE" });
        notify("Submission deleted", "success");
      } else {
        const status = action === "approve" ? "approved" : "rejected";
        await apiFetch(`/api/submissions/${id}`, { method: "PUT", body: { status } });
        notify(`Submission ${status}`, "success");
      }
      await load();
    } catch (err) {
      notify(err?.body?.error || err?.message || "Action failed", "error");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section>
      <h2>Submissions Management</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Search by file, email or notes" value={query} onChange={(e)=>setQuery(e.target.value)} style={{flex:1, minWidth:160}} />
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={limit} onChange={(e)=>setLimit(Number(e.target.value))}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <AdminButton onClick={()=>load(1)} variant="primary">Search</AdminButton>
      </div>

      {loading && <Spinner />}
      {error && <div style={{color:'red'}}>{error}</div>}

      {isNarrow ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {items.map(it => (
            <div key={it._id} style={{ border:'1px solid #eee', padding:10, borderRadius:6 }}>
              <div style={{ fontWeight:600 }}>{it.originalName}</div>
              <div style={{ fontSize:12, color:'#555' }}>{it.studentEmail || it.studentRole || '-'}</div>
              <div style={{ marginTop:6, display:'flex', gap:8 }}>
                <a href={it.downloadUrl || it.url} target="_blank" rel="noreferrer">Open</a>
                <AdminButton onClick={()=>setSelected(it)} variant="neutral">View</AdminButton>
                <AdminButton onClick={()=>doAction(it._id,'approve')} variant="success">Approve</AdminButton>
                <AdminButton onClick={()=>doAction(it._id,'reject')} variant="danger">Reject</AdminButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left', padding:8 }}>ID</th>
                <th style={{ textAlign:'left', padding:8 }}>File</th>
                <th style={{ textAlign:'left', padding:8 }}>Student</th>
                <th style={{ textAlign:'left', padding:8 }}>Subject</th>
                <th style={{ textAlign:'left', padding:8 }}>Status</th>
                <th style={{ textAlign:'left', padding:8 }}>Submitted</th>
                <th style={{ textAlign:'left', padding:8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it._id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding:8, width: 160 }}>{it._id}</td>
                  <td style={{ padding:8 }}>
                    <a href={it.downloadUrl || it.url} target="_blank" rel="noreferrer">{it.originalName}</a>
                  </td>
                  <td style={{ padding:8 }}>{it.studentEmail || it.studentRole || '-'}</td>
                  <td style={{ padding:8 }}>{it.subject || '-'}</td>
                  <td style={{ padding:8 }}>{it.status}</td>
                  <td style={{ padding:8 }}>{formatDate(it.uploadedAt)}</td>
                  <td style={{ padding:8 }}>
                    <AdminButton onClick={()=>setSelected(it)} style={{ marginRight:6 }} variant="neutral">View</AdminButton>
                    <AdminButton onClick={()=>doAction(it._id,'approve')} style={{ marginRight:6 }} variant="success">Approve</AdminButton>
                    <AdminButton onClick={()=>doAction(it._id,'reject')} style={{ marginRight:6 }} variant="danger">Reject</AdminButton>
                    <AdminButton onClick={()=>{ if(confirm('Delete submission?')) doAction(it._id,'delete'); }} style={{ marginLeft:6 }} variant="danger">Delete</AdminButton>
                  </td>
                </tr>
              ))}
              {items.length===0 && (
                <tr><td colSpan={7} style={{ padding:8 }}>No submissions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:12 }}>
        <AdminButton disabled={page<=1} onClick={()=>{ const p = Math.max(1,page-1); setPage(p); load(p); }}>Prev</AdminButton>
        <div>Page {page} / {totalPages}</div>
        <AdminButton disabled={page>=totalPages} onClick={()=>{ const p = Math.min(totalPages,page+1); setPage(p); load(p);}}>Next</AdminButton>
      </div>

      {selected && (
        <div style={{ position:'fixed', left:0, top:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', padding:20, borderRadius:6, width:'90%', maxWidth:900 }}>
            <h3>Submission details</h3>
            <div style={{ marginBottom:10 }}>
              <strong>File:</strong> <a href={selected.downloadUrl || selected.url} target="_blank" rel="noreferrer">{selected.originalName}</a>
            </div>
            <div style={{ marginBottom:10 }}><strong>Student:</strong> {selected.studentEmail || selected.studentRole}</div>
            <div style={{ marginBottom:10 }}><strong>Subject:</strong> {selected.subject}</div>
            <div style={{ marginBottom:10 }}><strong>Notes:</strong> {selected.notes}</div>
            <div style={{ marginBottom:10 }}><strong>Status:</strong> {selected.status}</div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <AdminButton onClick={()=>doAction(selected._id,'approve')} variant="success">Approve</AdminButton>
              <AdminButton onClick={()=>doAction(selected._id,'reject')} variant="danger">Reject</AdminButton>
              <AdminButton onClick={refreshAndClose} variant="neutral">Close</AdminButton>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
