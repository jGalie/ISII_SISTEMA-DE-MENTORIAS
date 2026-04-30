async function cargarNavbar() {
  const container = document.getElementById("shared-navbar");
  if (!container) return;

  const response = await fetch("/components/navbar.html");
  const html = await response.text();
  container.innerHTML = html;

  marcarNavActivo();
}

function marcarNavActivo() {
  const currentPath = window.location.pathname;

  if (currentPath.includes("inicio-estudiante.html")) {
    document.querySelector('[data-nav="inicio"]')?.classList.add("active");
  } else if (currentPath.includes("dashboard.html")) {
    document.querySelector('[data-nav="dashboard"]')?.classList.add("active");
  } else if (currentPath.includes("clases.html")) {
    document.querySelector('[data-nav="clases"]')?.classList.add("active");
  } else if (currentPath.includes("crear-clase.html")) {
    document.querySelector('[data-nav="crear"]')?.classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", cargarNavbar);
