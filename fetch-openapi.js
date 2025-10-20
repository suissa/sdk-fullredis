// Script para buscar o OpenAPI spec
async function fetchOpenAPI() {
  try {
    const response = await fetch('http://localhost:11912/openapi.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro ao buscar OpenAPI:', error.message);
  }
}

fetchOpenAPI();