const fetch_chem_data = async () => {
  // PubChem API #1
  try {
    var pubchem_url = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,IUPACName,Title/JSON';
    //var pubchem_url2 = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/estradiol/xrefs/RegistryID/JSON';
    var pubchem_response = await fetch(pubchem_url);
    var pubchem_content;

    if (!pubchem_response.ok) {
      throw new Error(`PubChem HTTP error—status: ${pubchem_response.status}`);
    } else {
      pubchem_content = await pubchem_response.json();
      document.write('PubChem content: ' + pubchem_content + '<br /><br />');
      console.log('PubChem content:');
      console.log(pubchem_content);
    }
  } catch(error) {
    document.write(`PubChem fetch failed: ${error}<br /><br />`);
    console.log(`PubChem fetch failed: ${error}`);
    //throw error; // Need to be rethrown to get to outer try...catch...finally
    return;
  }

  // PubChem API #2
  try {
    var pubchem_url2 = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/estradiol/xrefs/RegistryID/JSON';
    var pubchem_response2 = await fetch(pubchem_url2);
    var pubchem_content2;

    if (!pubchem_response2.ok) {
      throw new Error(`PubChem #2 HTTP error—status: ${pubchem_response2.status}`);
    } else {
      pubchem_content2 = await pubchem_response2.json();
      document.write('PubChem #2 content: ' + pubchem_content2 + '<br /><br />');
      console.log('PubChem #2 content:');
      console.log(pubchem_content2);
    }
  } catch(error) {
    document.write(`PubChem #2 fetch failed: ${error}<br /><br />`);
    console.log(`PubChem #2 fetch failed: ${error}`);
    //throw error; // Need to be rethrown to get to outer try...catch...finally
    return;
  }

  // Try up to 50 times (with 200 ms pauses -> 10 seconds in total)
  var tries = 50;
  for (var i = 0; i < tries; i++) {
    // ChemIDplus API
    try {
      var chemidplus_url = 'https://chem.nlm.nih.gov/api/data/inchikey/equals/VOXZDWNPVJITMN-ZBRFXRBCSA-N?data=details&format=json';
      var chemidplus_response = await fetch(chemidplus_url);
      var chemidplus_content;

      if (!chemidplus_response.ok) {
        // throw new Error(`ChemIDplus HTTP error—status: ${chemidplus_response.status}`);
      } else {
        chemidplus_content = await chemidplus_response.json();
        document.write('ChemIDplus content: ' + chemidplus_content + '<br /><br />');
        console.log('ChemIDplus content:');
        console.log(chemidplus_content);
        success = true;
        break;
      }
    } catch(error) {
      document.write(`ChemIDplus fetch failed: ${error}<br /><br />`);
      console.log(`ChemIDplus fetch failed: ${error}`);
      // If last try, quit
      /*if (i == tries - 1) {
        return;
      }*/
      // https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
      await new Promise(r => setTimeout(r, 200)); // Pause for 200 ms
      // return;
    }
  }

  // ChemSpider API
  try {
    var InChI = 'InChI=1S/C18H24O2/c1-18-9-8-14-13-5-3-12(19)10-11(13)2-4-15(14)16(18)6-7-17(18)20/h3,5,10,14-17,19-20H,2,4,6-9H2,1H3/t14-,15-,16+,17+,18+/m1/s1';
    var chemspider_api_url = 'https://www.chemspider.com/InChI.asmx/InChIToCSID?inchi=';
    var tunnel_url = 'https://tunnel.alyw234237.workers.dev/?q=';
    // InChI needs to be encoded twice for fetch to work for the tunnel
    var chemspider_url = tunnel_url + encodeURIComponent(chemspider_api_url + encodeURIComponent(InChI));
    var chemspider_response = await fetch(chemspider_url);
    var chemspider_content;

    if (!chemspider_response.ok) {
      throw new Error(`ChemSpider HTTP error—status: ${chemspider_response.status}`);
    } else {
      chemspider_content = await chemspider_response.text();
      //chemspider_content = new window.DOMParser().parseFromString(chemspider_content, "text/xml");
      document.write('ChemSpider content:<br /><textarea cols="50" rows="10">' + chemspider_content + '</textarea><br /><br />');
      console.log('ChemSpider content:');
      console.log(chemspider_content);
      var ChemSpiderID = handle_fetch_chemspider(chemspider_content);
    }
  } catch(error) {
    document.write(`ChemSpider fetch failed: ${error}<br /><br />`);
    console.log(`ChemSpider fetch failed: ${error}`);
    // return;
  }

  // Handle data
  // ...
  document.write(`Now handle data<br /><br />`);
  console.log('Now handle data');

  return;
}

fetch_chem_data();


// Extract ChemSpider ID from raw XML
function handle_fetch_chemspider(xml) {
  // Replace start part one (`<?xml version="1.0" encoding="utf-8"?>`)
  xml = xml.replace(/^\<\?xml .+\>/, '');
  xml = xml.replace(/^(\r\n|\r|\n)/, ''); // Newline
  // Replace start part two (`<string xmlns="http://www.chemspider.com/">`)
  xml = xml.replace(/^\<string xmlns\="http\:\/\/www\.chemspider\.com\/"\>/, '');
  // Replace ending (`</string>`)
  xml = xml.replace(/\<\/string\>$/, '');
  // Test it to verify ID found
  var ChemSpiderID;
  console.log('xml: ' + xml);
  if (xml.match(/^[0-9]+$/)) {
    ChemSpiderID = xml;
    document.write('ChemSpiderID: ' + ChemSpiderID + '<br /><br />');
    console.log('ChemSpiderID: ' + ChemSpiderID);
  }
  return ChemSpiderID;
}

