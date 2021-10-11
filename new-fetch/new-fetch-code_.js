const fetch_chem_data = async () => {
  try {
    // PubChem API
    try {
      var first_url = 'https://www.google.com/';
      var first_response = await fetch(first_url);
      var first_content;

      if (!first_response.ok) {
        throw new Error(`HTTP error! status: ${first_response.status}`);
      } else {
        first_content = await first_response.json();
      }
    } catch(error) {
      console.log(`First fetch failed: ${error}`);
      return;
    }

    // ChemIDplus API
    try {
      var second_url = 'https://www.google.com/';
      var second_response = await fetch(second_url);
      var second_content;

      if (!second_response.ok) {
        throw new Error(`HTTP error! status: ${second_response.status}`);
      } else {
        second_content = await second_response.json();
      }
    } catch(error) {
      console.log(`Second fetch failed: ${error}`);
      return;
    }

    // ChemSpider API
    try {
      var third_url = 'https://www.google.com/';
      var third_response = await fetch(third_url);
      var third_content;

      if (!third_response.ok) {
        throw new Error(`HTTP error! status: ${third_response.status}`);
      } else {
        third_content = await third_response.json();
      }
    } catch(error) {
      console.log(`Third fetch failed: ${error}`);
      return;
    }

    // Handle data
    // ...
    console.log('Handling data...');
  } finally {
    // Do any clean if necessary (e.g., if failed)
    // ...
  }
}

fetch_chem_data();

