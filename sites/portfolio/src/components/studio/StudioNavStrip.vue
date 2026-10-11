<template>
  <nav class="nav-strip">
    <span class="nav-label">Studio Sections</span>
    <ul class="nav-links">
      <li><RouterLink to="/">Studio</RouterLink></li>
      <li><RouterLink to="/projects">Projects</RouterLink></li>
      <li><RouterLink to="/marginalia">Marginalia</RouterLink></li>
      <li><RouterLink to="/newsletter">Newsletter</RouterLink></li>
      <li><RouterLink to="/about">About</RouterLink></li>
      <li><RouterLink to="/account">Account</RouterLink></li>
    </ul>
  </nav>
</template>

<style scoped>
.nav-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  gap: 1rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.nav-label {
  font-weight: 600;
}
.nav-links {
  list-style: none;
  display: flex;
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  font-weight: 600;
}
.nav-links a {
  text-decoration: none;
  color: #222;
  position: relative;
}
.nav-links a::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -0.1rem;
  width: 100%;
  height: 1px;
  background: transparent;
  transition: background 0.2s ease;
}
.nav-links a:hover::after {
  background: #222;
}
@media (max-width: 900px) {
  .nav-strip {
    flex-wrap: wrap;
  }
  .nav-links {
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-end;
  }
}
</style>
