export default function MeetingPage({ params, searchParams }) {
  const { id } = params || {};
  const name = searchParams?.name || "Guest";

  return (
    <div style={{ padding: "20px" }}>
      <h1>Meeting Page</h1>
      <p><strong>Meeting ID:</strong> {id || "No ID found"}</p>
      <p><strong>User:</strong> {name}</p>
    </div>
  );
}