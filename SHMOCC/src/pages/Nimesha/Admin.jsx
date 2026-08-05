import { useEffect, useState } from "react";

export default function Admin() {
  const [tab, setTab] = useState("dashboard");
  const [detections, setDetections] = useState([]);

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

 useEffect(() => {
  if (tab === "dashboard") {
    fetchDashboard();
  }

  if (tab === "users") {
    fetchUsers();
  }

  if (tab === "detections") {
    fetchDetections();
  }
}, [tab]);

 const fetchDashboard = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("cinnamonToken");

    const response = await fetch(
      "http://localhost:9000/api/admin/dashboard",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    setDashboard(data);
  } catch (err) {
    console.log(err);
  }

  setLoading(false);
};

const fetchUsers = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("cinnamonToken");

    const response = await fetch(
      "http://localhost:9000/api/admin/users",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    setUsers(data);
  } catch (err) {
    console.log(err);
  }

  setLoading(false);
};

const deleteUser = async (id) => {
  if (!window.confirm("Delete this user?")) return;

  try {
    const token = localStorage.getItem("cinnamonToken");

    await fetch(`http://localhost:9000/api/admin/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchUsers();
    fetchDashboard();
  } catch (err) {
    console.log(err);
  }
};

const deleteDetection = async (id) => {
  if (!window.confirm("Delete this detection?")) return;

  try {
    const token = localStorage.getItem("cinnamonToken");

    await fetch(`http://localhost:9000/api/admin/detections/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchDetections();
    fetchDashboard();
  } catch (err) {
    console.log(err);
  }
};
    
const fetchDetections = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("cinnamonToken");

    const response = await fetch(
      "http://localhost:9000/api/admin/detections",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    setDetections(data);
  } catch (err) {
    console.log(err);
  }

  setLoading(false);
};

  return (
    <div className="max-w-7xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        Admin Dashboard
      </h1>

      <div className="flex gap-4 mb-8">

        <button
          onClick={() => setTab("dashboard")}
          className={`px-5 py-2 rounded-lg ${
            tab === "dashboard"
              ? "bg-amber-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => setTab("users")}
          className={`px-5 py-2 rounded-lg ${
            tab === "users"
              ? "bg-amber-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Users
        </button>

        <button
          onClick={() => setTab("detections")}
          className={`px-5 py-2 rounded-lg ${
            tab === "detections"
              ? "bg-amber-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Detections
        </button>

      </div>

      <div className="bg-white rounded-xl shadow p-6 min-h-[500px]">

        {tab === "dashboard" && (

          <>
            {loading ? (
              <h2>Loading...</h2>
            ) : dashboard && (
              <>

                <div className="grid md:grid-cols-2 gap-6 mb-8">

                  <div className="bg-green-100 rounded-xl p-6">

                    <h3 className="text-gray-600">
                      Total Users
                    </h3>

                    <p className="text-4xl font-bold mt-3">
                      {dashboard.totalUsers}
                    </p>

                  </div>

                  <div className="bg-blue-100 rounded-xl p-6">

                    <h3 className="text-gray-600">
                      Total Detections
                    </h3>

                    <p className="text-4xl font-bold mt-3">
                      {dashboard.totalDetections}
                    </p>

                  </div>

                </div>

                <h2 className="text-2xl font-bold mb-4">
                  Recent Detections
                </h2>

                <table className="w-full border">

                  <thead className="bg-gray-100">

                    <tr>
                      <th className="p-3 border">User</th>
                      <th className="p-3 border">Email</th>
                      <th className="p-3 border">Grade</th>
                      <th className="p-3 border">Status</th>
                      <th className="p-3 border">Date</th>
                    </tr>

                  </thead>

                  <tbody>

                    {dashboard.recentDetections.map((item) => (

                      <tr key={item._id}>

                        <td className="border p-3">
                          {item.userId?.name}
                        </td>

                        <td className="border p-3">
                          {item.userId?.email}
                        </td>

                        <td className="border p-3">
                          {item.final_grade}
                        </td>

                        <td className="border p-3">
                          {item.status}
                        </td>

                        <td className="border p-3">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </>
            )}
          </>

        )}

        {tab === "users" && (
  <>
    {loading ? (
      <h2>Loading...</h2>
    ) : (
      <>
        <h2 className="text-2xl font-bold mb-5">
          All Users
        </h2>

        <table className="w-full border">

          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3">Name</th>
              <th className="border p-3">Email</th>
              <th className="border p-3">Role</th>
              <th className="border p-3">Action</th>
            </tr>
          </thead>

          <tbody>

            {users.map((user) => (

              <tr key={user._id}>

                <td className="border p-3">
                  {user.name}
                </td>

                <td className="border p-3">
                  {user.email}
                </td>

                <td className="border p-3">
                  {user.role}
                </td>
                 <td className="border p-3 text-center">
                <button
                onClick={() => deleteUser(user._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                Delete
                </button>
            </td>

              </tr>

            ))}

          </tbody>

        </table>
      </>
    )}
  </>
)}

       {tab === "detections" && (
  <>
    {loading ? (
      <h2>Loading...</h2>
    ) : (
      <>
        <h2 className="text-2xl font-bold mb-5">
          All Detections
        </h2>

        <table className="w-full border">

          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3">User</th>
              <th className="border p-3">Email</th>
              <th className="border p-3">Grade</th>
              <th className="border p-3">Status</th>
              <th className="border p-3">Date</th>
              <th className="border p-3">Action</th>
            </tr>
          </thead>

          <tbody>

            {detections.map((item) => (

              <tr key={item._id}>

                <td className="border p-3">
                  {item.userId?.name}
                </td>

                <td className="border p-3">
                  {item.userId?.email}
                </td>

                <td className="border p-3">
                  {item.final_grade}
                </td>

                <td className="border p-3">
                  {item.status}
                </td>

                <td className="border p-3">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
                <td className="border p-3 text-center">
                <button
                onClick={() => deleteDetection(item._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                Delete
                </button>
            </td> 

              </tr>

            ))}

          </tbody>

        </table>
      </>
    )}
  </>
)}

      </div>

    </div>
  );
}