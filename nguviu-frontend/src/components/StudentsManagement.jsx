import { useEffect, useState } from "react";

export default function StudentsManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Simulate fetching student data
    setTimeout(() => {
      setStudents([
        { id: 1, name: "Jane Doe", email: "jane.doe@embuni.ac.ke", program: "Computer Science", status: "Active" },
        { id: 2, name: "John Mwangi", email: "john.mwangi@embuni.ac.ke", program: "Business Administration", status: "Active" },
        { id: 3, name: "Mary Wambui", email: "mary.wambui@embuni.ac.ke", program: "Education", status: "Suspended" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <section>
      <h2>Students Management</h2>
      <p>View and manage student profiles, academic programs, and enrollment status.</p>

      {loading && <p>Loading students...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
          <thead>
            <tr style={{ backgroundColor: "#d60a0a", color: "#fff" }}>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Program</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Status</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(({ id, name, email, program, status }) => (
              <tr key={id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: 10 }}>{name}</td>
                <td style={{ padding: 10 }}>{email}</td>
                <td style={{ padding: 10 }}>{program}</td>
                <td style={{ padding: 10 }}>{status}</td>
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
                    onClick={() => alert(`Manage student: ${name}`)}
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
