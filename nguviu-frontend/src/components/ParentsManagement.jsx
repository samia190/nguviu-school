import { useEffect, useState } from "react";

export default function ParentsManagement() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setParents([
        { id: 1, name: "Alice Mwangi", email: "alice.mwangi@example.com", phone: "0712345678", student: "Jane Mwangi" },
        { id: 2, name: "Peter Otieno", email: "peter.otieno@example.com", phone: "0723456789", student: "John Otieno" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <section>
      <h2>Parents Management</h2>
      <p>Manage parent and guardian contact information linked to students.</p>

      {loading && <p>Loading parents data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
          <thead>
            <tr style={{ backgroundColor: "#d60a0a", color: "#fff" }}>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Phone</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Student</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parents.map(({ id, name, email, phone, student }) => (
              <tr key={id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: 10 }}>{name}</td>
                <td style={{ padding: 10 }}>{email}</td>
                <td style={{ padding: 10 }}>{phone}</td>
                <td style={{ padding: 10 }}>{student}</td>
                <td style={{ padding: 10 }}>
                  <button
                    style={{
                      backgroundColor: "#d60a0a",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}
                    onClick={() => alert(`Manage parent: ${name}`)}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
