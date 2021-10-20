// On window/tab load (not back/forward)
window.onload = function() {

  // Handle URL parameters

  // Get URL parameters
  const query_string = window.location.search;
  const url_params = new URLSearchParams(query_string);

  // Set initial history state information and clear address bar URL parameters
  var state = {
    identifier: '',
    compoundbox: '',
  }
  window.history.replaceState(state, null, window.location.pathname);

  // If applicable URL parameter, then there's a pre-specified identifier -> parse it
  if (url_params.has('i') || url_params.has('id') || url_params.has('cid') || url_params.has('url') || url_params.has('name')) {
    var identifier;
    if (url_params.has('i')) {
      identifier = url_params.get('i');
    } else if (url_params.has('id')) {
      identifier = url_params.get('id');
    } else if (url_params.has('cid')) {
      identifier = url_params.get('cid');
    } else if (url_params.has('url')) {
      identifier = url_params.get('url');
    } else if (url_params.has('name')) {
      identifier = url_params.get('name');
    }
    document.getElementById('identifier').value = identifier;
    parse_input(identifier);
  }

  // Read and set saved box type
  var box_type = localStorage.getItem('box-type');
  if (!box_type || box_type == 'drugbox') {
    document.getElementById('box-type1').checked = true;
  } else {
    document.getElementById('box-type2').checked = true;
  }

  return;
};

// On back/forward event
window.onpopstate = function(event) {
  // Restore previous form values if applicable
  if (event.state) {
    if (event.state.identifier || event.state.identifier == '') {
      var identifier = event.state.identifier;
      document.getElementById('identifier').value = identifier;
    }
    if (event.state.compoundbox || event.state.compoundbox == '') {
      var compoundbox = event.state.compoundbox;
      document.getElementById('compoundbox').value = compoundbox;
    }
  }
  return;
};

// Save box_type for next time upon radio click
function box_type_click() {
  // Get box type user input
  var box_type = document.getElementById('box-type1').checked;

  // Drugbox
  if (box_type == true) {
    localStorage.setItem('box-type', 'drugbox');
  // Chembox
  } else {
    localStorage.setItem('box-type', 'chembox');
  }
  
  return;
}

// 'Copied' tooltip timeout
var tooltip_timeout;

function copy_to_clipboard() {
  // Get textarea
  var compoundbox = document.getElementById("compoundbox");

  // Create hidden element with textarea text to avoid selecting text of textarea
  var copy_text = document.createElement('textarea');
  copy_text.style.display = 'none';
  document.body.appendChild(copy_text)

  // Assign textarea text to hidden element
  copy_text.value = compoundbox.value;

  // Select the text of the hidden element
  copy_text.focus();
  copy_text.select();
  copy_text.setSelectionRange(0, 99999); // For mobile devices

  // Copy the text of the hidden element
  navigator.clipboard.writeText(copy_text.value);

  // Remove the hidden element
  copy_text.parentNode.removeChild(copy_text);
  //compoundbox.focus(); // Causes scroll to reset to top... just skip it

  // Update copy button hover tooltip to indicate text copied
  var tooltip = document.getElementById('copy_tooltip');
  tooltip.innerHTML = "Copied!";
  tooltip.style.display = 'block';

  // Clear any previous tooltip timeouts
  clearTimeout(tooltip_timeout);

  // Reset tooltip text after 3 seconds
  tooltip_timeout = setTimeout(function() {
    var tooltip = document.getElementById('copy_tooltip');
    tooltip.style.display = 'none';
  }, 3000);

  return;
}

// Escape all strings in object (including nested)
function escape_all(object) {
  for (var key in object) {
    if (!object.hasOwnProperty(key)) {
      continue;
    }
    if (typeof object[key] !== 'object') {
      object[key] = escape_plaintext_for_wikicode(object[key]);
    } else {
      escape_all(object[key]);
    }
  }
  return object;
}

// Escape plaintext for wikicode in string (via <nowiki></nowiki>)
// Also converts undefined variables to ''
function escape_plaintext_for_wikicode (string) {
  if (string) {
    string = String(string);
    // Escape |, [[, ]], {{, }}, '', <, >
    // Doesn't currently catch `[https://site.com/]` format links
    if (string.match(/([|]|\[{2,}|\]{2,}|[{]{2,}|[}]{2,}|'{2,}|<|>)/)) {
      string = '<nowiki>' + string + '</nowiki>';
    }
  } else {
    string = '';
  }
  return string;
}

var waiting_for_fetch_response = false;

function fetch_cleanup() {
  waiting_for_fetch_response = false;
  loading_animation('hide');
  return;
}

var loading_animation_delay = 2000; // 1 second

// Show or hide loading animation
function loading_animation(display) {
  var loading_animation = document.getElementById('loading-animation');
  if (display == 'hide') {
    loading_animation.style.display = 'none';
  } else if (display == 'show') {
    loading_animation.style.display = 'block';
  }
  return;
}

// Update/change user feedback message
// Possible method options: 'add', 'replace', 'clear'
// Possible color options: 'red', 'orange', 'green', 'blue'
function update_user_message(method, color, message) {
  var user_message = document.getElementById('user_message');
  message = '<span class=' + color + '>' + message + '</span>';
  if (method == 'add') {
    if (user_message.innerHTML == '') {
      user_message.innerHTML = message;
    } else {
      user_message.innerHTML += ' ' + message;
    }
  } else if (method == 'replace') {
    user_message.innerHTML = message;
  } else if (method == 'clear') {
    user_message.innerHTML = '';
  }
  return;
}

// Select compoundbox text after making compoundbox
function select_text(compoundbox) {
  compoundbox.setSelectionRange(0, 0); // Place cursor at start
  compoundbox.focus();
  //compoundbox.select(); // Disable this for now
}

// PubChem ID (CID) or PubChem name
function is_valid_id(identifier) {
  // As of 5 October 2021, lowest PubChem CID is 1 and highest CID is 156612376 (9 digits) (or 156,612,376)
  // 10 digits (9,999,999,999—63x higher than current highest) seems like a reasonable max for foreseeable future
  // Misses input with leading zeros (which are not valid IDs) but not a big deal
  if (identifier.match(/^[0-9]{1,10}$/)) {
    return true;
  // Names are also acceptable
  } if (identifier.match(/^[a-zα-ω0-9\s-_"'+&%()\[\]]{3,}$/i)) {
    return true;
  } else {
    return false;
  }
}

var in_progress = false;

// Called when identifier input field changes
function parse_input(identifier) {

  // If a parse_input() is already in-progress, don't continue
  if (in_progress == true) {
    return;
  } else {
    in_progress = true;
  }

  // Clear console from last time
  console.clear();

  // Get needed elements
  var compoundbox = document.getElementById('compoundbox');

  // Reset from last time if needed
  compoundbox.value = "";
  update_user_message('clear');

  // Get user input / identifier (if don't already have it)
  if (!identifier) {
    identifier = document.getElementById('identifier').value;
  }

  // Trim any leading/trailing whitespace (spaces, newlines, etc.)
  identifier = identifier.trim();

  // If PubChem URL, isolate the ID or name
  if (identifier.includes('pubchem.ncbi.nlm.nih.gov')) {
    identifier = identifier.replace(/^((https?:[/][/]|https?:|[/][/])?(www[.])?)(pubchem[.]ncbi[.]nlm[.]nih[.]gov[/]compound[/])/, ''); // PubChem protocol/domain/path
    identifier = identifier.replaceAll(/[?].*$/g, ''); // Query string
    identifier = identifier.replaceAll(/#.*$/g, ''); // Fragment
  }

  if (identifier == '') {
    // update_user_message('replace', 'red', 'No identifier entered. Please try again.');
    in_progress = false;
    return;
  }

  // Check that identifier is valid then handle it
  if (is_valid_id(identifier) == true) {
    do_compoundbox(identifier);
  } else {
    update_user_message('replace', 'red', 'Not a valid <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank">PubChem</a> compound ID, URL, or name. Please try again.');
    in_progress = false;
    return;
  }

  return;
}

function do_compoundbox(identifier) {

  // Set up variables and get needed elements
  var pubchem_identifier = decodeURIComponent(identifier); // Decode URI if necessary
  var compound_dict = {};
  compound_dict['ChemIDplus'] = {}; // For later
  compound_dict['pubchem_identifier'] = pubchem_identifier;

  fetch_chem_data(compound_dict);

  return;
}

// Fetch compound data from chemical sources (PubChem, ChemIDplus, ChemSpider, etc.)
async function fetch_chem_data(compound_dict) {

  waiting_for_fetch_response = true;

  // Show loading animation after delay if fetch takes too long
  setTimeout(function() {
    if (waiting_for_fetch_response == true) {
      loading_animation('show');
    }
  }, loading_animation_delay);

  var identifier_string = compound_dict['pubchem_identifier'];
  // If PubChem compound ID (numeric)
  if (compound_dict['pubchem_identifier'].match(/^[0-9]{1,10}$/)) {
    identifier_string = 'cid/' + identifier_string;
  // If PubChem name
  } else {
    identifier_string = 'name/' + encodeURIComponent(identifier_string);
  }

  // Fetch PubChem compound JSON metadata from PubChem REST API
  try {
    // https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest
    // Example: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5757/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,IUPACName,Title/JSON

    var pubchem_url1 = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/' + identifier_string + '/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,IUPACName,Title/JSON';
    var pubchem_url2 = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/' + identifier_string + '/xrefs/RegistryID/JSON';

    var [pubchem_response1, pubchem_response2] = await Promise.all([
      fetch(pubchem_url1),
      fetch(pubchem_url2)
    ]);

    if (!pubchem_response1.ok) {
      throw pubchem_response1.status;
    } else {
      var pubchem_content1 = await pubchem_response1.json();
      //console.log('PubChem #1 content:');
      //console.log(pubchem_content1);
    }

    if (!pubchem_response2.ok) {
      throw pubchem_response2.status;
    } else {
      var pubchem_content2 = await pubchem_response2.json();
      //console.log('PubChem #2 content:');
      //console.log(pubchem_content2);
    }

    // Combine the two JSON into a single object
    var pubchem_content_combined = Object.assign({}, pubchem_content1, pubchem_content2);

    // Parse PubChem response data and put it into compound data object
    compound_dict = handle_fetch_pubchem_rest(pubchem_content_combined, compound_dict);
  } catch(error) {
    //console.log('Error string is -> "' + error + '"');
    fetch_cleanup();
    in_progress = false;

    if (error == 404) {
      update_user_message('replace', 'red', 'Not a valid <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank">PubChem</a> compound ID, URL, or name. Please try again.');
    } else if (error == 429) {
      update_user_message('replace', 'red', '<a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank">PubChem</a> says too many requests right now. Please try again later.');
    // Other errors (e.g., error == "TypeError: Failed to fetch") will go here
    } else {
      update_user_message('replace', 'red', 'The web request to <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank">PubChem</a> failed. You might not have Internet connectivity right now or PubChem might be having issues or there might be another problem. Please try again. If it still doesn\'t work, try again later.');
    }
    return;
  }

  // Fetch ChemIDplus JSON metadata from ChemIDplus API
  // Try up to 50 times (with 200 ms pauses -> 10 seconds in total)
  var tries = 50;
  var break_loop = false;
  for (var i = 0; i < tries; i++) {
    try {
      var chemidplus_url = 'https://chem.nlm.nih.gov/api/data/inchikey/equals/' + 
        encodeURIComponent(compound_dict['InChIKey']) + 
        '?data=details&format=json';

      var chemidplus_response = await fetch(chemidplus_url);

      if (!chemidplus_response.ok) {
        throw chemidplus_response.status;
      } else {
        var chemidplus_content = await chemidplus_response.json();
        //console.log('ChemIDplus content:');
        //console.log(chemidplus_content);
        compound_dict = handle_fetch_chemidplus(chemidplus_content, compound_dict);
        break_loop = true;
      }
    } catch(error) {
      //console.log('Error string is -> "' + error + '"');
      if (error == 404) {
        update_user_message('add', 'orange', 'No <a href="https://chem.nlm.nih.gov/chemidplus/" target="_blank">ChemIDplus</a> entry for this compound. Hence, couldn\'t pull data from ChemIDplus. Please fill in the missing fields manually.');
        break_loop = true;
      } else if (error == 429) {
        update_user_message('add', 'orange', '<a href="https://chem.nlm.nih.gov/chemidplus/" target="_blank">ChemIDplus</a> says too many requests right now. Hence, couldn\'t pull data from ChemIDplus. Please try again later for full parameters.');
        break_loop = true;
      // Other errors (e.g., error == "TypeError: Failed to fetch") will go here
      } else {
        // If not last try, pause
        if (i != tries - 1) {
          // https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
          await new Promise(r => setTimeout(r, 200)); // Pause for 200 ms
        // If last try, quit
        } else {
          update_user_message('add', 'orange', 'The web request to <a href="https://chem.nlm.nih.gov/chemidplus/" target="_blank">ChemIDplus</a> failed. Hence, couldn\'t pull data from it. This happens sometimes. Please try again for full parameters. If it still doesn\'t work, try again later.');
          break_loop = true;
        }
      }
    }
    if (break_loop == true) {
      break;
    }
  }

  // ChemSpider API
  try {
    var InChI = 'InChI=' + compound_dict['InChI'];
    var chemspider_api_url = 'https://www.chemspider.com/InChI.asmx/InChIToCSID?inchi=';
    var tunnel_url = 'https://tunnel.alyw234237.workers.dev/?q=';
    // InChI needs to be encoded twice for fetch to work for the tunnel
    var chemspider_url = tunnel_url + encodeURIComponent(chemspider_api_url + encodeURIComponent(InChI));
    var chemspider_response = await fetch(chemspider_url);
    var chemspider_content;

    if (!chemspider_response.ok) {
      throw chemspider_response.status;
    } else {
      chemspider_content = await chemspider_response.text();
      compound_dict = handle_fetch_chemspider(chemspider_content, compound_dict);
      if (!compound_dict['ChemSpiderID']) {
        throw 404;
      }
    }
  } catch(error) {
    //console.log('Error string is -> "' + error + '"');
    if (error == 404) {
      update_user_message('add', 'orange', 'No <a href="https://chemspider.com/" target="_blank">ChemSpider</a> entry and hence no ChemSpider ID for this compound.');
    } else if (error == 429) {
      update_user_message('add', 'orange', '<a href="https://chemspider.com/" target="_blank">ChemSpider</a> says too many requests right now. Hence, couldn\'t fetch ChemSpider ID. Please try again later for this field.');
    // Other errors (e.g., error == "TypeError: Failed to fetch") will go here
    } else {
      update_user_message('add', 'orange', 'The web request to <a href="https://chemspider.com/" target="_blank">ChemSpider</a> failed. Hence, couldn\'t fetch ChemSpider ID. Please try again later for this field.');
    }
  }

  fetch_cleanup();

  construct_compoundbox(compound_dict);

  return;
}

function handle_fetch_pubchem_rest(json, compound_dict) {

  var compound_metadata = json;
  //console.log(compound_metadata);

  // Combine everything into one well-structured object
  var properties = compound_metadata['PropertyTable']['Properties'][0];
  var synonyms = compound_metadata['InformationList']['Information'][0]['RegistryID'];
  properties['synonyms'] = synonyms;
  compound_dict = Object.assign({}, compound_dict, properties);

  // If standard/simple chemical formula
  // Another/different handling library to look at (no Lodash): https://github.com/kanedaron/chemical-regex
  if (compound_dict['MolecularFormula']) {
    // Chemical formula regex: /^([A-Z][a-z]?[0-9]{0,6})+$/ (no longer used here for now)
    // Largest known protein is titin (connectin), with formula of C(169,719)H(270,466)N(45,688)O(52,238)S(911)
    // So 6 digits seems good for maximum number in chemical formula
    var molecular_formula = compound_dict['MolecularFormula'];
    // Extract charge if applicable
    if (molecular_formula.match(/[+-][0-9]*$/)) {
      var charge = molecular_formula.match(/[+-][0-9]*$/)[0]; // Get charge
      charge = charge.replace(/^([+-])([0-9]+)$/, "$2$1"); // Swap charge +/- and # (e.g., -2 to 2-)
      molecular_formula = molecular_formula.replace(/[+-][0-9]*$/, ''); // Remove charge from molecular formula
      compound_dict['Charge'] = charge;
    }
    molecular_formula = chemicalFormula(molecular_formula); // Won't handle charge, will mess it up
    compound_dict['MolecularFormula'] = molecular_formula;
  }

  // Round down to three decimal places if applicable
  if (compound_dict['MolecularWeight']) {
    compound_dict['MolecularWeight'] = parseFloat(parseFloat(compound_dict['MolecularWeight']).toFixed(3));
  }

  // Remove 'InChI=' from start of StdInChI string
  compound_dict['InChI'] = compound_dict['InChI'].replace(/^(InChI=)/, '');

  // Get ChEBI from synonyms
  var ChEBI = compound_dict['synonyms'].find(value => /^C[Hh]EBI:[0-9]+$/.test(value));
  if (ChEBI) {
    // Remove 'ChEBI:' from start of string
    ChEBI = ChEBI.replace(/^C[Hh]EBI:/, '');
    ChEBI = ChEBI.match(/^[0-9]+$/)[0];
    // Prior way using positive lookbehind
    //ChEBI = ChEBI.match(/(?<=^C[Hh]EBI:)[0-9]+$/)[0];
    compound_dict['ChEBI'] = ChEBI;
  }

  // Get ChEMBL from synonyms
  // ChEMBL is prefixed with 'ChEMBL' then appears to start at 1
  // http://chembl.blogspot.com/2011/08/chembl-identifiers.html
  var ChEMBL = compound_dict['synonyms'].find(value => /^C[Hh]EMBL[0-9]+$/.test(value));
  if (ChEMBL) {
    // Remove 'ChEMBL' from start of string
    ChEMBL = ChEMBL.replace(/^C[Hh]EMBL/, '');
    ChEMBL = ChEMBL.match(/^[0-9]+$/)[0];
    // Prior way using positive lookbehind
    //ChEMBL = ChEMBL.match(/(?<=^C[Hh]EBI:)[0-9]+$/)[0];
    compound_dict['ChEMBL'] = ChEMBL;
  }

  // Get KEGG compound ID and/or drug ID from synonyms
  // KEGG takes the form of 'C' for compound or 'D' for drug then five digits
  // https://www.genome.jp/kegg/kegg3.html
  var KEGG_drug = compound_dict['synonyms'].find(value => /^D[0-9]{5}$/.test(value));
  if (KEGG_drug) {
    compound_dict['KEGGdrug'] = KEGG_drug;
  }
  var KEGG_compound = compound_dict['synonyms'].find(value => /^C[0-9]{5}$/.test(value));
  if (KEGG_compound) {
    compound_dict['KEGGcompound'] = KEGG_compound;
  }

  return compound_dict;
}

function handle_fetch_chemidplus(json, compound_dict) {

  var chemidplus_metadata = json;
  //console.log(chemidplus_metadata);

  // Ensure exactly 1 result (no more or less than this)
  if (chemidplus_metadata && chemidplus_metadata['total'] && chemidplus_metadata['total'] > 0) {

    // Check if more than one (happens with e.g. estradiol InChIKey search...)
    if (chemidplus_metadata['total'] > 1) {
      console.log('Warning: two results retrieved for ChemIDplus InChIKey search... taking first result only.');
    }

    // Filter to first result
    chemidplus_metadata = chemidplus_metadata['results'][0];
    //console.log(chemidplus_metadata);

    // Get ChemIDplus 'summary' items we care about
    var summary = chemidplus_metadata['summary'];
    compound_dict['ChemIDplus']['name_special'] = summary['na']; // Format: 'Name [USAN:USP:INN:BAN]'
    compound_dict['ChemIDplus']['CASNo'] = summary['rn'];
    compound_dict['ChemIDplus']['MolWeight'] = summary['w']; // Four decimal places

    // Round down to three decimal places if applicable
    if (compound_dict['ChemIDplus']['MolWeight']) {
      compound_dict['ChemIDplus']['MolWeight'] = parseFloat((compound_dict['ChemIDplus']['MolWeight']).toFixed(3));
    }

    // Get all ChemIDplus 'resources' items and put into easier to work with form
    var resources_temp = {};
    var resources = chemidplus_metadata['resources'];
    for (var i = 0; i < resources.length; i++) {
      var e = resources[i]['e'];
      for (var j = 0; j < e.length; j++) {
        // If doesn't already exist
        if (!resources_temp[e[j]['d']]) {
          resources_temp[e[j]['d']] = e[j]['u'];
        } else {
          console.log('Warning: key already exists... unexpected duplicate encountered.');
        }
      }
    }
    resources = resources_temp;
    //console.log(resources);

    // Take the 'resources' items we care about
    compound_dict['ChemIDplus']['DailyMedID'] = resources['DailyMed'];
    compound_dict['ChemIDplus']['MedlinePlus'] = resources['MedlinePlusDrug']; // Has '.html' at end of string
    //compound_dict['ChemIDplus']['ChEBI'] = resources['ChEBI']; // If exists (check.. undefined for bica, E2)
    //compound_dict['ChemIDplus']['ChEMBL'] = resources['ChEMBL']; // If exists (check.. didn't for bica, E2)
    compound_dict['ChemIDplus']['DrugBank'] = resources['DrugBank'];
    compound_dict['ChemIDplus']['UNII'] = resources['FDA SRS']; // Has 'unii/' at start of string
    compound_dict['ChemIDplus']['Wikipedia'] = resources['Wikipedia']; // Do something with this?

    // Fix a couple of items
    if (compound_dict['ChemIDplus']['MedlinePlus']) {
      compound_dict['ChemIDplus']['MedlinePlus'] = compound_dict['ChemIDplus']['MedlinePlus'].replace(/[.]html$/, '');
    }
    if (compound_dict['ChemIDplus']['UNII']) {
      compound_dict['ChemIDplus']['UNII'] = compound_dict['ChemIDplus']['UNII'].replace(/^unii[/]/, '');
    }

    // Get all ChemIDplus 'names' (or 'synonyms') items and put into easier to work with form
    var names_temp = [];
    var names = chemidplus_metadata['names'];
    for (var i = 0; i < names.length; i++) {
      var e = names[i]['e'];
      for (var j = 0; j < e.length; j++) {
        names_temp.push(e[j]['d']);
      }
    }
    names = names_temp;
    //console.log(names);

    // Take all of the synonyms
    compound_dict['ChemIDplus']['synonyms'] = [];
    compound_dict['ChemIDplus']['synonyms'] = names;

    // Get EINECS from synonyms
    // EINECS format: seven-digit number of the form 2XX-XXX-X or 3XX-XXX-X
    // https://www.chemeurope.com/en/encyclopedia/EINECS_number.html
    // https://en.wikipedia.org/wiki/European_Community_number
    var EINECS = compound_dict['ChemIDplus']['synonyms'].find(value => /^EINECS [23][0-9]{2}-[0-9]{3}-[0-9]$/.test(value));
    if (EINECS) {
      // Remove 'EINECS' from start of string
      EINECS = EINECS.replace(/^EINECS /, '');
      EINECS = EINECS.match(/^[23]{1}[0-9]{2}-[0-9]{3}-[0-9]{1}$/)[0];
      // Prior way using positive lookbehind
      //EINECS = EINECS.match(/(?<=^EINECS )[23][0-9]{2}-[0-9]{3}-[0-9]$/)[0];
      compound_dict['ChemIDplus']['EINECS'] = EINECS;
    } else {
      compound_dict['ChemIDplus']['EINECS'] = undefined;
    }

    //console.log(compound_dict['ChemIDplus']);
  }

  //console.log(compound_dict);

  return compound_dict;
}

// Extract ChemSpider ID from raw ChemSpider XML response data
function handle_fetch_chemspider(xml, compound_dict) {
  // Replace start part one (`<?xml version="1.0" encoding="utf-8"?>`)
  xml = xml.replace(/^\<\?xml .+\>/, '');
  xml = xml.replace(/^(\r\n|\r|\n)/, ''); // Newline
  // Replace start part two (`<string xmlns="http://www.chemspider.com/">`)
  xml = xml.replace(/^\<string xmlns\="http\:\/\/www\.chemspider\.com\/"\>/, '');
  // Replace ending (`</string>`)
  xml = xml.replace(/\<\/string\>$/, '');
  // Test it to verify ID found
  var ChemSpiderID;
  //console.log('xml: ' + xml);
  if (xml.match(/^[0-9]+$/)) {
    ChemSpiderID = xml;
    //console.log('ChemSpiderID: ' + ChemSpiderID);
  }

  compound_dict['ChemSpiderID'] = ChemSpiderID;

  return compound_dict;
}

// Construct Wikipedia drugbox/chembox
function construct_compoundbox(compound_dict) {

  // Escape special characters with <nowiki> tags
  // Also convert undefined variables to ''
  compound_dict = escape_all(compound_dict);

  // Get box type user input
  var box_type = document.getElementById('box-type1').checked;

  // Drugbox
  if (box_type == true) {
    make_drugbox(compound_dict);
    // Save box_type for next time
    localStorage.setItem('box-type', 'drugbox');
  // Chembox
  } else {
    make_chembox(compound_dict);
    // Save box_type for next time
    localStorage.setItem('box-type', 'chembox');
  }

  return;
}

// Make synonyms list string for compoundbox
function make_synonyms_list(synonyms) {
  var synonyms_string = '';
  if (synonyms) {
    // Remove duplicates
    // https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
    synonyms = [...new Set(synonyms)];

    // Turn array into '; '-delimited string
    for (var i = 0; i < synonyms.length; i++) {
      synonyms_string += synonyms[i];
      if (i != synonyms.length - 1) {
        synonyms_string += '; ';
      }
    }
  }
  return synonyms_string;
}

// Make molecular formula string for compoundbox
function make_molecular_formula_string(molecular_formula, charge, box_type) {
  var molecular_formula_string = '';
  if (molecular_formula) {
    // Drugbox as well as Chembox without charge
    if (box_type == 'drugbox' || (box_type == 'chembox' && !charge)) {
      var index = 0;
      for (const [key, value] of Object.entries(molecular_formula)) {
        if (chemical_symbols.includes(key)) {
          if (index == 0) {
            molecular_formula_string += `| ` + key + `=` + value;
          } else {
            molecular_formula_string += ` | ` + key + `=` + value;
          }
        }
        index++;
      }
      if (charge) {
        molecular_formula_string += ` | charge = ` + charge;
      }
    // Chembox with charge (fallback to 'Formula' field as no 'Charge' field in chemboxes)
    } else {
      molecular_formula_string += `| Formula = `;
      for (const [key, value] of Object.entries(molecular_formula)) {
        if (chemical_symbols.includes(key)) {
          if (value > 1) {
            molecular_formula_string += key + `<sub>` + value + `</sub>`;
          // Skip <sub>1</sub>
          } else {
            molecular_formula_string += key;
          }
        }
      }
      if (charge) {
        molecular_formula_string += `<sup>` + charge + `</sup>`;
      }
    }
  }
  return molecular_formula_string;
}

// Make Wikipedia drugbox
// https://en.wikipedia.org/wiki/Template:Infobox_drug (same as Template:Drugbox (redirect))
function make_drugbox(compound_dict) {

  var compoundbox_string = `{{Infobox drug
| drug_name = 
| image = 
| width = 
| caption = 

<!-- Clinical data -->
| pronounce = 
| tradename = 
| Drugs.com = 
| MedlinePlus = ` + (compound_dict['ChemIDplus']['MedlinePlus'] || '') + `
| licence_CA = 
| licence_EU = 
| DailyMedID = ` + (compound_dict['ChemIDplus']['DailyMedID'] || '') + `
| licence_US = 
| pregnancy_AU = 
| pregnancy_category = 
| dependency_liability = 
| addiction_liability = 
| routes_of_administration = 
| class = 
| ATC_prefix = 
| ATC_suffix = 

<!-- Legal status -->
| legal_status = 

<!-- Pharmacokinetic data -->
| bioavailability = 
| protein_bound = 
| metabolism = 
| metabolites = 
| onset = 
| elimination_half-life = 
| duration_of_action = 
| excretion = 

<!-- Identifiers -->
| CAS_number = ` + (compound_dict['ChemIDplus']['CASNo'] || '') + `
| CAS_supplemental = 
| PubChem = ` + (compound_dict['CID'] || '') + `
| IUPHAR_ligand = ` + (compound_dict['IUPHAR_ligand'] || '') + `
| DrugBank = ` + (compound_dict['ChemIDplus']['DrugBank'] || '') + `
| ChemSpiderID = ` + (compound_dict['ChemSpiderID'] || '') + `
| UNII = ` + (compound_dict['ChemIDplus']['UNII'] || '') + `
| KEGG = ` + (compound_dict['KEGGdrug'] || compound_dict['KEGGcompound'] || '') + `
| ChEBI = ` + (compound_dict['ChEBI'] || '') + `
| ChEMBL = ` + (compound_dict['ChEMBL'] || '') + `
| NIAID_ChemDB = ` + (compound_dict['NIAID_ChemDB'] || '') + `
| PDB_ligand = ` + (compound_dict['PDB_ligand'] || '') + `
| synonyms = ` + (make_synonyms_list(compound_dict['ChemIDplus']['synonyms']) || '') + `

<!-- Chemical data -->
| IUPAC_name = ` + (compound_dict['IUPACName'] || '') + `
` + (make_molecular_formula_string(compound_dict['MolecularFormula'], compound_dict['Charge'], 'drugbox') || '') + `
| SMILES = ` + (compound_dict['IsomericSMILES'] || compound_dict['CanonicalSMILES'] || '') + `
| StdInChI = ` + (compound_dict['InChI'] || '') + `
| StdInChIKey = ` + (compound_dict['InChIKey'] || '') + `
}}`;

  // Do after construct compoundbox stuff
  after_make_compoundbox(compoundbox_string, compound_dict);

  return compoundbox_string;
}

// Make Wikipedia chembox
// https://en.wikipedia.org/wiki/Template:Chembox
function make_chembox(compound_dict) {

    // Add 'g/mol' to molecular weight if it exists
  if (compound_dict['ChemIDplus']['MolWeight']) {
    compound_dict['ChemIDplus']['MolWeight'] += ' g/mol';
  } else if (compound_dict['MolecularWeight']) {
    compound_dict['MolecularWeight'] += ' g/mol';
  }

  var compoundbox_string = `{{Chembox
<!-- Images -->
| ImageFile = 
| ImageSize = 
<!-- Names -->
| IUPACName = ` + (compound_dict['IUPACName'] || '') + `
| OtherNames = ` + (make_synonyms_list(compound_dict['ChemIDplus']['synonyms']) || '') + `
<!-- Sections -->
| Section1 = {{Chembox Identifiers
| CASNo = ` + (compound_dict['ChemIDplus']['CASNo'] || '') + `
| ChEBI = ` + (compound_dict['ChEBI'] || '') + `
| ChEMBL = ` + (compound_dict['ChEMBL'] || '') + `
| ChemSpiderID = ` + (compound_dict['ChemSpiderID'] || '') + `
| DrugBank = ` + (compound_dict['ChemIDplus']['DrugBank'] || '') + `
| EINECS = ` + (compound_dict['ChemIDplus']['EINECS'] || '') + `
| EC_number = 
| InChI = ` + (compound_dict['InChI'] || '') + `
| InChIKey = ` + (compound_dict['InChIKey'] || '') + `
| KEGG = ` + (compound_dict['KEGGcompound'] || compound_dict['KEGGdrug'] || '') + `
| MeSHName = 
| PubChem = ` + (compound_dict['CID'] || '') + `
| SMILES = ` + (compound_dict['IsomericSMILES'] || compound_dict['CanonicalSMILES'] || '') + `
  }}
| Section2 = {{Chembox Properties
` + (make_molecular_formula_string(compound_dict['MolecularFormula'], compound_dict['Charge'], 'chembox') || '') + `
| MolarMass = ` + (compound_dict['ChemIDplus']['MolWeight'] || compound_dict['MolecularWeight'] || '') + `
| Appearance = 
| Density = 
| MeltingPt = 
| BoilingPt = 
| Solubility = 
  }}
| Section3 = {{Chembox Hazards
| MainHazards = 
| FlashPt = 
| AutoignitionPt = 
  }}
}}`;

  // Do after construct compoundbox stuff
  after_make_compoundbox(compoundbox_string, compound_dict);

  return compoundbox_string;
}

// Do some extra stuff? (I.e., start article)
function add_more_stuff(compoundbox_string, compound_dict) {

  compoundbox_string += `\n\n`;
  if (compound_dict['ChemIDplus'] && compound_dict['ChemIDplus']['name_special']) {
    compoundbox_string += `'''` + compound_dict['ChemIDplus']['name_special'] + `''' is a ...`;
  } else if (compound_dict['Title']) {
    compoundbox_string += `'''` + compound_dict['Title'] + `''' is a ...`;
  }
  compoundbox_string += `\n\n`;
  compoundbox_string += `==References==\n{{Reflist}}\n\n`;

  return compoundbox_string;
}

// Update compoundbox textarea after generating compoundbox
function after_make_compoundbox(compoundbox_string, compound_dict) {

  // Add some more stuff?
  var add_more_stuff = false;
  if (add_more_stuff == true) {
    compoundbox_string = add_more_stuff(compoundbox_string, compound_dict);
  }

  // Warning about not-100%-certainty with KEGG, ChEBI, ChEMBL, and EINECS identifiers for now
  if (compound_dict['ChEBI'] || compound_dict['ChEMBL'] || compound_dict['ChemIDplus']['EINECS'] || compound_dict['KEGGdrug'] || compound_dict['KEGGcompound']) {
    update_user_message('add', 'green', 'Autofilled the following with form-matching identifiers from synonyms lists:');
    if (compound_dict['ChEBI']) {
      update_user_message('add', 'green', '<a href="https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:' + compound_dict['ChEBI'] + '" target="_blank">ChEBI</a>.');
    }
    if (compound_dict['ChEMBL']) {
      update_user_message('add', 'green', '<a href="https://www.ebi.ac.uk/chembl/compound_report_card/CHEMBL' + compound_dict['ChEMBL'] + '" target="_blank">ChEMBL</a>.');
    }
    var box_type = document.getElementById('box-type1').checked;
    // Drugbox only
    if (box_type == false && compound_dict['ChemIDplus']['EINECS']) {
      update_user_message('add', 'green', '<a href="https://echa.europa.eu/information-on-chemicals/ec-inventory?p_p_id=disslists_WAR_disslistsportlet&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&_disslists_WAR_disslistsportlet_javax.portlet.action=searchDissLists&doSearch=true&_disslists_WAR_disslistsportlet_substance_identifier_field_key=' + compound_dict['ChemIDplus']['EINECS'] + '" target="_blank">EINECS</a>.');
    }
    // Drugbox
    if (box_type == true) {
      if (compound_dict['KEGGdrug']) {
        update_user_message('add', 'green', '<a href="https://www.kegg.jp/entry/' + compound_dict['KEGGdrug'] + '" target="_blank">KEGG</a>.');
      } else if (compound_dict['KEGGcompound']) {
        update_user_message('add', 'green', '<a href="https://www.kegg.jp/entry/' + compound_dict['KEGGcompound'] + '" target="_blank">KEGG</a>.');
      }
    // Chembox
    } else {
      if (compound_dict['KEGGcompound']) {
        update_user_message('add', 'green', '<a href="https://www.kegg.jp/entry/' + compound_dict['KEGGcompound'] + '" target="_blank">KEGG</a>.');
      } else if (compound_dict['KEGGdrug']) {
        update_user_message('add', 'green', '<a href="https://www.kegg.jp/entry/' + compound_dict['KEGGdrug'] + '" target="_blank">KEGG</a>.');
      }
    }
    update_user_message('add', 'green', 'Please double-check them for accuracy.');
  }

  // Warning about synonyms/other names field
  if (compound_dict['ChemIDplus']['synonyms']) {
    update_user_message('add', 'green', 'Synonyms field included. Please check and fix it.');
  }

  // Links to additional fields not autofilled
  if (!compound_dict['ChemIDplus']['DrugBank'] || !compound_dict['IUPHAR_ligand'] || !compound_dict['NIAID_ChemDB'] || !compound_dict['PDB_ligand']) {
    update_user_message('add', 'green', 'Links to try for unfilled additional identifiers:');
    if (!compound_dict['ChemIDplus']['DrugBank']) {
      var link = 'https://go.drugbank.com/unearth/q?searcher=drugs&query=' + compound_dict['InChIKey'];
      update_user_message('add', 'green', '<a href="' + link + '" target="_blank">DrugBank</a>.');
    }
    if (!compound_dict['IUPHAR_ligand']) {
      var link = 'https://www.guidetopharmacology.org/GRAC/LigandTextSearchForward?searchAcc=' + compound_dict['InChIKey'] + '&accTypes=inchiKey&submitAcc=Search+the+database';
      update_user_message('add', 'green', '<a href="' + link + '" target="_blank">IUPHAR_ligand</a>.');
    }
    if (!compound_dict['NIAID_ChemDB']) {
      var link = 'https://chemdb.niaid.nih.gov/CompoundSearch.aspx';
      update_user_message('add', 'green', '<a href="' + link + '" target="_blank">NIAID_ChemDB</a>.');
    }
    if (!compound_dict['PDB_ligand']) {
      var link = 'https://www.rcsb.org/search?request=' + encodeURIComponent('{"query":{"type":"group","logical_operator":"and","nodes":[{"type":"terminal","service":"chemical","parameters":{"value":"InChI=' + compound_dict['InChIKey'] + '","type":"descriptor","descriptor_type":"InChI","match_type":"graph-exact"}}]},"return_type":"mol_definition","request_info":{"query_id":""},"request_options":{"pager":{"start":0,"rows":25},"scoring_strategy":"combined","sort":[{"sort_by":"score","direction":"desc"}]}}');
      update_user_message('add', 'green', '<a href="' + link + '" target="_blank">PDB_ligand</a>.');
    }
  }

  // Update compoundbox
  var compoundbox = document.getElementById('compoundbox');
  compoundbox.value = compoundbox_string;

  // Focus/select compoundbox text
  select_text(compoundbox);

  // Update page history
  var identifier = document.getElementById('identifier').value;
  var state = {
    identifier: identifier,
    compoundbox: compoundbox_string,
  }
  window.history.pushState(state, null);

  in_progress = false;

  return;
}

