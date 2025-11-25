export function showAlert(message: string, type: "success" | "error" = "error") {
  const area = document.getElementById("alert-area");
  if (!area) return;

  area.innerHTML = `
    <div class="alert alert-${type === "error" ? "danger" : "success"} mt-3">
      ${message}
    </div>
  `;

  setTimeout(() => (area.innerHTML = ""), 5000);
}