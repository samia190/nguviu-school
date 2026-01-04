import { useEffect, useState } from "react";

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setStaff([
        { id: 1, name: "Dr. Paul Kimani", department: "Computer Science", email: "paul.kimani@embuni.ac.ke", role: "Lecturer" },
        { id: 2, name: "Prof. Grace Njeri", department: "Business Studies", email: "grace.njeri@embuni.ac.ke", role: "Professor" },
        { id: 3, name: "Mr. Samuel Otieno", department: "Administration", email: "samuel.otieno@embuni.ac.ke", role: "Administrator" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <section>
      <h2>Staff Management</h2>
      <p>Manage academic and administrative staff details.</p>

      {loading && <p>Loading staff members...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
          <thead>
            <tr style={{ backgroundColor: "#d60a0a", color: "#fff" }}>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Department</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Role</th>
              <th style={{ padding: 10, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(({ id, name, department, email, role }) => (
              <tr key={id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: 10 }}>{name}</td>
                <td style={{ padding: 10 }}>{department}</td>
                <td style={{ padding: 10 }}>{email}</td>
                <td style={{ padding: 10 }}>{role}</td>
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
                    onClick={() => alert(`Manage staff: ${name}`)}
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

