export async function loadLayout() {
  const headerHTML = await fetch("/src/components/header.html").then((r) => r.text());
  const footerHTML = await fetch("/src/components/footer.html").then((r) => r.text());

  document.body.insertAdjacentHTML("afterbegin", headerHTML);
  document.body.insertAdjacentHTML("beforeend", footerHTML);
}

export function handleSearch(event: Event) {
  event.preventDefault();
  const q = (document.getElementById("search") as HTMLInputElement).value.trim();
  if (q) window.location.href = `/src/pages/group_list.html?q=${encodeURIComponent(q)}`;
}

export function logout() {
  localStorage.removeItem("authToken");
  window.location.href = "/src/pages/login.html";
}

window.addEventListener("DOMContentLoaded", loadLayout);
