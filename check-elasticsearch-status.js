const axios = require("axios");

async function checkElasticsearchStatus() {
  try {
    const response = await axios.get("http://elasticsearch:9200");
    console.log(response.data);
  } catch (error) {
    console.error("Error checking Elasticsearch status:", error);
  }
}

checkElasticsearchStatus();
